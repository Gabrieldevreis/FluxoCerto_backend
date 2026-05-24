import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CategoryOrigin, Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ORDER_EVENTS } from '../../shared/events/order.events';
import type { OrderConfirmedPayload } from '../../shared/events/order.events';
import {
  CashFlowQueryDto,
  CreateTransactionDto,
} from './dto/transaction.dto';
import {
  CreateFinanceCategoryDto,
  UpdateFinanceCategoryDto,
} from './dto/finance-category.dto';

const SYSTEM_ORDER_INCOME_CATEGORY = 'Receita de Pedido';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ===== Categorias =====
  listCategories() {
    return this.prisma.financeCategory.findMany({
      orderBy: [{ origin: 'asc' }, { name: 'asc' }],
    });
  }

  createCategory(dto: CreateFinanceCategoryDto) {
    return this.prisma.financeCategory.create({
      data: { name: dto.name, origin: CategoryOrigin.CUSTOM },
    });
  }

  async updateCategory(id: string, dto: UpdateFinanceCategoryDto) {
    const category = await this.assertCategory(id);
    if (category.origin === CategoryOrigin.SYSTEM) {
      throw new ConflictException('Categorias do sistema não podem ser editadas.');
    }
    return this.prisma.financeCategory.update({ where: { id }, data: dto });
  }

  async removeCategory(id: string) {
    const category = await this.assertCategory(id);
    if (category.origin === CategoryOrigin.SYSTEM) {
      throw new ConflictException('Categorias do sistema não podem ser removidas.');
    }
    return this.prisma.financeCategory.delete({ where: { id } });
  }

  // ===== Transações =====
  listTransactions(query: CashFlowQueryDto) {
    return this.prisma.transaction.findMany({
      where: this.buildDateFilter(query),
      include: { category: true, order: true },
      orderBy: { occurredAt: 'desc' },
    });
  }

  async createTransaction(dto: CreateTransactionDto) {
    await this.assertCategory(dto.categoryId);

    return this.prisma.transaction.create({
      data: {
        type: dto.type,
        amount: dto.amount,
        description: dto.description,
        categoryId: dto.categoryId,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
      },
      include: { category: true },
    });
  }

  async removeTransaction(id: string) {
    const tx = await this.prisma.transaction.findUnique({ where: { id } });
    if (!tx) throw new NotFoundException('Transação não encontrada.');
    if (tx.orderId) {
      throw new ConflictException(
        'Transações geradas por pedidos não podem ser removidas manualmente.',
      );
    }
    return this.prisma.transaction.delete({ where: { id } });
  }

  // ===== Fluxo de caixa =====
  async cashFlow(query: CashFlowQueryDto) {
    const where = this.buildDateFilter(query);

    const [income, expense, byCategory] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { ...where, type: TransactionType.INCOME },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...where, type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['categoryId', 'type'],
        where,
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = Number(income._sum.amount ?? 0);
    const totalExpense = Number(expense._sum.amount ?? 0);

    return {
      from: query.from ?? null,
      to: query.to ?? null,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      byCategory: byCategory.map((b) => ({
        categoryId: b.categoryId,
        type: b.type,
        amount: Number(b._sum.amount ?? 0),
      })),
    };
  }

  /**
   * Listener: ao confirmar pedido, lança uma receita automaticamente.
   * Garante idempotência via @@unique(orderId).
   */
  @OnEvent(ORDER_EVENTS.CONFIRMED, { async: true })
  async handleOrderConfirmed(payload: OrderConfirmedPayload) {
    try {
      const category = await this.ensureOrderIncomeCategory();

      await this.prisma.transaction.upsert({
        where: { orderId: payload.orderId },
        create: {
          type: TransactionType.INCOME,
          amount: payload.total,
          description: `Pedido mesa ${payload.tableNumber}`,
          categoryId: category.id,
          orderId: payload.orderId,
        },
        update: {
          amount: payload.total,
        },
      });

      this.logger.log(`Receita lançada para pedido ${payload.orderId}`);
    } catch (err) {
      this.logger.error(
        `Falha ao lançar receita do pedido ${payload.orderId}`,
        err as Error,
      );
    }
  }

  private async ensureOrderIncomeCategory() {
    return this.prisma.financeCategory.upsert({
      where: { name: SYSTEM_ORDER_INCOME_CATEGORY },
      create: {
        name: SYSTEM_ORDER_INCOME_CATEGORY,
        origin: CategoryOrigin.SYSTEM,
      },
      update: {},
    });
  }

  private async assertCategory(id: string) {
    const category = await this.prisma.financeCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Categoria financeira não encontrada.');
    return category;
  }

  private buildDateFilter(query: CashFlowQueryDto): Prisma.TransactionWhereInput {
    if (!query.from && !query.to) return {};
    const range: Prisma.DateTimeFilter = {};
    if (query.from) range.gte = new Date(query.from);
    if (query.to) range.lte = new Date(query.to);
    return { occurredAt: range };
  }
}

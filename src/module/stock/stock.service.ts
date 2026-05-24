import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ORDER_EVENTS } from '../../shared/events/order.events';
import type { OrderConfirmedPayload } from '../../shared/events/order.events';
import {
  CreateStockMovementDto,
  UpsertStockDto,
} from './dto/stock-movement.dto';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(private readonly prisma: PrismaService) {}

  listStock() {
    return this.prisma.stockEntry.findMany({
      include: { ingredient: true },
      orderBy: { ingredient: { name: 'asc' } },
    });
  }

  lowStockAlerts() {
    return this.prisma.stockEntry.findMany({
      where: { quantity: { lte: this.prisma.stockEntry.fields.minimumAlert } },
      include: { ingredient: true },
    });
  }

  async upsertStock(ingredientId: string, dto: UpsertStockDto) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: ingredientId },
    });
    if (!ingredient) throw new NotFoundException('Ingrediente não encontrado.');

    return this.prisma.stockEntry.upsert({
      where: { ingredientId },
      create: {
        ingredientId,
        quantity: dto.quantity,
        minimumAlert: dto.minimumAlert ?? 0,
      },
      update: {
        quantity: dto.quantity,
        minimumAlert: dto.minimumAlert ?? undefined,
      },
      include: { ingredient: true },
    });
  }

  async registerMovement(ingredientId: string, dto: CreateStockMovementDto) {
    const stock = await this.prisma.stockEntry.findUnique({
      where: { ingredientId },
    });
    if (!stock) {
      throw new NotFoundException(
        'Não existe entrada de estoque para esse ingrediente. Crie via upsert antes.',
      );
    }

    const newQuantity = stock.quantity.plus(dto.quantity);
    if (newQuantity.lt(0)) {
      throw new BadRequestException('Quantidade resultante seria negativa.');
    }

    return this.prisma.$transaction([
      this.prisma.stockMovement.create({
        data: {
          stockEntryId: stock.id,
          quantity: dto.quantity,
          reason: dto.reason,
          orderId: dto.orderId,
        },
      }),
      this.prisma.stockEntry.update({
        where: { id: stock.id },
        data: { quantity: newQuantity },
      }),
    ]);
  }

  listMovements(ingredientId?: string) {
    return this.prisma.stockMovement.findMany({
      where: ingredientId ? { stockEntry: { ingredientId } } : undefined,
      include: { stockEntry: { include: { ingredient: true } } },
      orderBy: { occurredAt: 'desc' },
      take: 200,
    });
  }

  /**
   * Listener: ao confirmar pedido, baixa cada ingrediente das receitas vinculadas.
   * Itens sem receita (ex: bebidas industrializadas) são ignorados.
   */
  @OnEvent(ORDER_EVENTS.CONFIRMED, { async: true })
  async handleOrderConfirmed(payload: OrderConfirmedPayload) {
    this.logger.log(`Baixando estoque para pedido ${payload.orderId}`);

    const recipeIds = payload.items
      .map((i) => i.recipeId)
      .filter((id): id is string => !!id);

    if (recipeIds.length === 0) return;

    const recipes = await this.prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      include: { ingredients: true },
    });

    const recipeMap = new Map(recipes.map((r) => [r.id, r]));

    try {
      await this.prisma.$transaction(async (tx) => {
        for (const item of payload.items) {
          if (!item.recipeId) continue;
          const recipe = recipeMap.get(item.recipeId);
          if (!recipe) continue;

          for (const ri of recipe.ingredients) {
            const totalNeeded = new Prisma.Decimal(ri.quantity).mul(item.quantity);

            const stock = await tx.stockEntry.findUnique({
              where: { ingredientId: ri.ingredientId },
            });
            if (!stock) continue;

            const newQty = stock.quantity.minus(totalNeeded);

            await tx.stockMovement.create({
              data: {
                stockEntryId: stock.id,
                quantity: totalNeeded.negated(),
                reason: `Baixa pedido #${payload.orderId}`,
                orderId: payload.orderId,
              },
            });

            await tx.stockEntry.update({
              where: { id: stock.id },
              data: { quantity: newQty },
            });
          }
        }
      });
    } catch (err) {
      this.logger.error(
        `Falha ao baixar estoque do pedido ${payload.orderId}`,
        err as Error,
      );
    }
  }
}

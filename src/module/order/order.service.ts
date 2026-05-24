import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../shared/decorators/current-user.decorator';
import {
  ORDER_EVENTS,
  OrderCancelledPayload,
  OrderConfirmedPayload,
  OrderDonePayload,
} from '../../shared/events/order.events';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
} from './dto/create-order.dto';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.DONE, OrderStatus.CANCELLED],
  DONE: [],
  CANCELLED: [],
};

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async list(user: AuthenticatedUser) {
    return this.prisma.order.findMany({
      where:
        user.role === UserRole.ADMIN
          ? undefined
          : { waiterId: user.sub },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { menuItem: true } },
        waiter: { select: { id: true, name: true } },
      },
    });
  }

  async findById(id: string, user: AuthenticatedUser) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { menuItem: { include: { recipe: true } } } },
        waiter: { select: { id: true, name: true } },
      },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado.');
    if (user.role !== UserRole.ADMIN && order.waiterId !== user.sub) {
      throw new ForbiddenException('Sem acesso a este pedido.');
    }
    return order;
  }

  async create(dto: CreateOrderDto, user: AuthenticatedUser) {
    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, isAvailable: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException(
        'Um ou mais itens são inválidos ou indisponíveis.',
      );
    }

    const priceMap = new Map(menuItems.map((m) => [m.id, m.price]));

    return this.prisma.order.create({
      data: {
        tableNumber: dto.tableNumber,
        notes: dto.notes,
        waiterId: user.sub,
        items: {
          create: dto.items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            unitPrice: priceMap.get(i.menuItemId)!,
            notes: i.notes,
          })),
        },
      },
      include: { items: { include: { menuItem: true } } },
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    user: AuthenticatedUser,
  ) {
    const order = await this.findById(id, user);

    const target = dto.status as OrderStatus;
    const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];

    if (!allowed.includes(target)) {
      throw new BadRequestException(
        `Transição inválida: ${order.status} -> ${target}.`,
      );
    }

    const data: Prisma.OrderUpdateInput = { status: target };
    if (target === OrderStatus.CONFIRMED) data.confirmedAt = new Date();
    if (target === OrderStatus.DONE) data.doneAt = new Date();

    const updated = await this.prisma.order.update({
      where: { id },
      data,
      include: {
        items: { include: { menuItem: { include: { recipe: true } } } },
      },
    });

    if (target === OrderStatus.CONFIRMED) {
      const payload: OrderConfirmedPayload = {
        orderId: updated.id,
        tableNumber: updated.tableNumber,
        waiterId: updated.waiterId,
        total: updated.items.reduce(
          (acc, it) => acc + Number(it.unitPrice) * it.quantity,
          0,
        ),
        items: updated.items.map((it) => ({
          orderItemId: it.id,
          menuItemId: it.menuItemId,
          recipeId: it.menuItem.recipeId ?? null,
          quantity: it.quantity,
          unitPrice: Number(it.unitPrice),
        })),
      };
      this.events.emit(ORDER_EVENTS.CONFIRMED, payload);
    }

    if (target === OrderStatus.CANCELLED) {
      const payload: OrderCancelledPayload = {
        orderId: updated.id,
        tableNumber: updated.tableNumber,
        reason: dto.reason,
      };
      this.events.emit(ORDER_EVENTS.CANCELLED, payload);
    }

    if (target === OrderStatus.DONE) {
      const payload: OrderDonePayload = {
        orderId: updated.id,
        tableNumber: updated.tableNumber,
      };
      this.events.emit(ORDER_EVENTS.DONE, payload);
    }

    return updated;
  }
}

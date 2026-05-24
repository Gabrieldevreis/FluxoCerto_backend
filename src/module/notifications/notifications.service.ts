import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { ORDER_EVENTS } from '../../shared/events/order.events';
import type {
  OrderCancelledPayload,
  OrderConfirmedPayload,
  OrderDonePayload,
} from '../../shared/events/order.events';
import { WHATSAPP_ADAPTER } from './adapters/whatsapp.adapter';
import type { WhatsAppAdapter } from './adapters/whatsapp.adapter';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject(WHATSAPP_ADAPTER) private readonly whatsapp: WhatsAppAdapter,
    private readonly config: ConfigService,
  ) {}

  @OnEvent(ORDER_EVENTS.CONFIRMED, { async: true })
  async onConfirmed(payload: OrderConfirmedPayload) {
    await this.dispatch(
      `Pedido confirmado — Mesa ${payload.tableNumber} — Total R$ ${payload.total.toFixed(2)}`,
    );
  }

  @OnEvent(ORDER_EVENTS.DONE, { async: true })
  async onDone(payload: OrderDonePayload) {
    await this.dispatch(`Pedido da mesa ${payload.tableNumber} pronto para servir.`);
  }

  @OnEvent(ORDER_EVENTS.CANCELLED, { async: true })
  async onCancelled(payload: OrderCancelledPayload) {
    const reason = payload.reason ? ` (motivo: ${payload.reason})` : '';
    await this.dispatch(`Pedido da mesa ${payload.tableNumber} cancelado${reason}.`);
  }

  private async dispatch(body: string) {
    const to = this.config.get<string>('WHATSAPP_KITCHEN_PHONE');
    if (!to) {
      this.logger.warn(
        'WHATSAPP_KITCHEN_PHONE não configurado — notificação ignorada.',
      );
      return;
    }
    try {
      await this.whatsapp.send({ to, body });
    } catch (err) {
      this.logger.error('Falha ao enviar mensagem no WhatsApp', err as Error);
    }
  }
}

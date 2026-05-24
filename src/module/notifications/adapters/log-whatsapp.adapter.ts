import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppAdapter, WhatsAppMessage } from './whatsapp.adapter';

/**
 * Adapter padrão para ambiente de dev: apenas loga a mensagem.
 * Em produção, substitua pelo adapter real (Twilio, Z-API, etc.).
 */
@Injectable()
export class LogWhatsAppAdapter implements WhatsAppAdapter {
  private readonly logger = new Logger('WhatsApp');

  async send(message: WhatsAppMessage): Promise<void> {
    this.logger.log(`[->${message.to}] ${message.body}`);
  }
}

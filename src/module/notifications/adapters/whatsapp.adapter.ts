export interface WhatsAppMessage {
  to: string;
  body: string;
}

export interface WhatsAppAdapter {
  send(message: WhatsAppMessage): Promise<void>;
}

export const WHATSAPP_ADAPTER = Symbol('WHATSAPP_ADAPTER');

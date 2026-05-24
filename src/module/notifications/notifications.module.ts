import { Module } from '@nestjs/common';
import { LogWhatsAppAdapter } from './adapters/log-whatsapp.adapter';
import { WHATSAPP_ADAPTER } from './adapters/whatsapp.adapter';
import { NotificationsService } from './notifications.service';

@Module({
  providers: [
    NotificationsService,
    {
      provide: WHATSAPP_ADAPTER,
      useClass: LogWhatsAppAdapter,
    },
  ],
  exports: [NotificationsService, WHATSAPP_ADAPTER],
})
export class NotificationsModule {}

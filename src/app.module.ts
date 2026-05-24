import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './module/auth/auth.module';
import { JwtAuthGuard } from './module/auth/guards/jwt-auth.guard';
import { FinanceModule } from './module/finance/finance.module';
import { MenuModule } from './module/menu/menu.module';
import { NotificationsModule } from './module/notifications/notifications.module';
import { OrderModule } from './module/order/order.module';
import { StockModule } from './module/stock/stock.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    StockModule,
    MenuModule,
    OrderModule,
    FinanceModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

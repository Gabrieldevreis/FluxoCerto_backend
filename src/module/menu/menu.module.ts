import { Module } from '@nestjs/common';
import { MenuAdminController } from './menu-admin.controller';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

@Module({
  controllers: [MenuController, MenuAdminController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}

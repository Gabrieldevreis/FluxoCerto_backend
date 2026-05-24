import { Controller, Get } from '@nestjs/common';
import { Public } from '../../shared/decorators/public.decorator';
import { MenuService } from './menu.service';

@Public()
@Controller('menu')
export class MenuController {
  constructor(private readonly service: MenuService) {}

  @Get()
  publicMenu() {
    return this.service.publicMenu();
  }
}

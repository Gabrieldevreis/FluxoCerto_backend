import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../shared/guards/roles.guard';
import {
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
} from './dto/menu-category.dto';
import {
  CreateMenuItemDto,
  UpdateMenuItemDto,
} from './dto/menu-item.dto';
import { MenuService } from './menu.service';

@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/menu')
export class MenuAdminController {
  constructor(private readonly service: MenuService) {}

  // ===== Categorias =====
  @Get('categories')
  listCategories() {
    return this.service.listCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateMenuCategoryDto) {
    return this.service.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateMenuCategoryDto) {
    return this.service.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  removeCategory(@Param('id') id: string) {
    return this.service.removeCategory(id);
  }

  // ===== Itens =====
  @Get('items')
  listItems() {
    return this.service.listItems();
  }

  @Get('items/:id')
  findItem(@Param('id') id: string) {
    return this.service.findItem(id);
  }

  @Post('items')
  createItem(@Body() dto: CreateMenuItemDto) {
    return this.service.createItem(dto);
  }

  @Patch('items/:id')
  updateItem(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.service.updateItem(id, dto);
  }

  @Patch('items/:id/toggle')
  toggle(@Param('id') id: string) {
    return this.service.toggleAvailability(id);
  }

  @Delete('items/:id')
  removeItem(@Param('id') id: string) {
    return this.service.removeItem(id);
  }
}

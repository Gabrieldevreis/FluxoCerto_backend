import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
} from './dto/menu-category.dto';
import {
  CreateMenuItemDto,
  UpdateMenuItemDto,
} from './dto/menu-item.dto';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cardápio público — apenas itens disponíveis, agrupados por categoria.
   */
  publicMenu() {
    return this.prisma.menuCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        items: {
          where: { isAvailable: true },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            imageUrl: true,
          },
        },
      },
    });
  }

  listCategories() {
    return this.prisma.menuCategory.findMany({
      orderBy: { order: 'asc' },
      include: { items: true },
    });
  }

  createCategory(dto: CreateMenuCategoryDto) {
    return this.prisma.menuCategory.create({ data: dto });
  }

  async updateCategory(id: string, dto: UpdateMenuCategoryDto) {
    await this.assertCategory(id);
    return this.prisma.menuCategory.update({ where: { id }, data: dto });
  }

  async removeCategory(id: string) {
    await this.assertCategory(id);
    return this.prisma.menuCategory.delete({ where: { id } });
  }

  listItems() {
    return this.prisma.menuItem.findMany({
      orderBy: [{ category: { order: 'asc' } }, { name: 'asc' }],
      include: { category: true, recipe: true },
    });
  }

  async findItem(id: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
      include: { category: true, recipe: true },
    });
    if (!item) throw new NotFoundException('Item do cardápio não encontrado.');
    return item;
  }

  createItem(dto: CreateMenuItemDto) {
    return this.prisma.menuItem.create({ data: dto });
  }

  async updateItem(id: string, dto: UpdateMenuItemDto) {
    await this.findItem(id);
    return this.prisma.menuItem.update({ where: { id }, data: dto });
  }

  async toggleAvailability(id: string) {
    const item = await this.findItem(id);
    return this.prisma.menuItem.update({
      where: { id },
      data: { isAvailable: !item.isAvailable },
    });
  }

  async removeItem(id: string) {
    await this.findItem(id);
    return this.prisma.menuItem.delete({ where: { id } });
  }

  private async assertCategory(id: string) {
    const category = await this.prisma.menuCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Categoria não encontrada.');
    return category;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
      include: { stock: true },
    });
  }

  async findById(id: string) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id },
      include: { stock: true },
    });
    if (!ingredient) throw new NotFoundException('Ingrediente não encontrado.');
    return ingredient;
  }

  create(dto: CreateIngredientDto) {
    return this.prisma.ingredient.create({ data: dto });
  }

  async update(id: string, dto: UpdateIngredientDto) {
    await this.findById(id);
    return this.prisma.ingredient.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.ingredient.delete({ where: { id } });
  }
}

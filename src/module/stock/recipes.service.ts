import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateRecipeDto,
  UpdateRecipeDto,
} from './dto/create-recipe.dto';

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.recipe.findMany({
      orderBy: { name: 'asc' },
      include: { ingredients: { include: { ingredient: true } } },
    });
  }

  async findById(id: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: { ingredients: { include: { ingredient: true } } },
    });
    if (!recipe) throw new NotFoundException('Receita não encontrada.');
    return recipe;
  }

  create(dto: CreateRecipeDto) {
    return this.prisma.recipe.create({
      data: {
        name: dto.name,
        description: dto.description,
        yieldAmount: dto.yieldAmount,
        yieldUnit: dto.yieldUnit,
        ingredients: {
          create: dto.ingredients.map((i) => ({
            ingredientId: i.ingredientId,
            quantity: i.quantity,
            unit: i.unit,
          })),
        },
      },
      include: { ingredients: { include: { ingredient: true } } },
    });
  }

  async update(id: string, dto: UpdateRecipeDto) {
    await this.findById(id);

    return this.prisma.$transaction(async (tx) => {
      if (dto.ingredients) {
        await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
        await tx.recipeIngredient.createMany({
          data: dto.ingredients.map((i) => ({
            recipeId: id,
            ingredientId: i.ingredientId,
            quantity: i.quantity,
            unit: i.unit,
          })),
        });
      }

      return tx.recipe.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          yieldAmount: dto.yieldAmount,
          yieldUnit: dto.yieldUnit,
        },
        include: { ingredients: { include: { ingredient: true } } },
      });
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.recipe.delete({ where: { id } });
  }
}

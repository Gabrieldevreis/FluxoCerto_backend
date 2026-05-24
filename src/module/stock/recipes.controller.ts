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
  CreateRecipeDto,
  UpdateRecipeDto,
} from './dto/create-recipe.dto';
import { RecipesService } from './recipes.service';

@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('stock/recipes')
export class RecipesController {
  constructor(private readonly service: RecipesService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  create(@Body() dto: CreateRecipeDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRecipeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

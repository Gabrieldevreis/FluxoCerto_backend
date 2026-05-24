import { Module } from '@nestjs/common';
import { IngredientsController } from './ingredients.controller';
import { IngredientsService } from './ingredients.service';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

@Module({
  controllers: [IngredientsController, RecipesController, StockController],
  providers: [IngredientsService, RecipesService, StockService],
  exports: [IngredientsService, RecipesService, StockService],
})
export class StockModule {}

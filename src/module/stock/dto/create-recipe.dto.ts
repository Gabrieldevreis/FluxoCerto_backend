import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Unit } from '@prisma/client';

export class RecipeIngredientDto {
  @IsString()
  ingredientId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  quantity: number;

  @IsEnum(Unit)
  unit: Unit;
}

export class CreateRecipeDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  yieldAmount: number;

  @IsEnum(Unit)
  yieldUnit: Unit;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients: RecipeIngredientDto[];
}

export class UpdateRecipeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  yieldAmount?: number;

  @IsOptional()
  @IsEnum(Unit)
  yieldUnit?: Unit;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients?: RecipeIngredientDto[];
}

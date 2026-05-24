import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Unit } from '@prisma/client';

export class UpdateIngredientDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEnum(Unit)
  unit?: Unit;
}

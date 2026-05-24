import { IsEnum, IsString, MinLength } from 'class-validator';
import { Unit } from '@prisma/client';

export class CreateIngredientDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEnum(Unit)
  unit: Unit;
}

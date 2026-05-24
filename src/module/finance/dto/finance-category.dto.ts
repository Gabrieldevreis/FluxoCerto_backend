import { IsString, MinLength } from 'class-validator';

export class CreateFinanceCategoryDto {
  @IsString()
  @MinLength(2)
  name: string;
}

export class UpdateFinanceCategoryDto {
  @IsString()
  @MinLength(2)
  name: string;
}

import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateMenuCategoryDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateMenuCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateStockMovementDto {
  @IsNumber({ maxDecimalPlaces: 3 })
  quantity: number;

  @IsString()
  @MinLength(2)
  reason: string;

  @IsOptional()
  @IsString()
  orderId?: string;
}

export class UpsertStockDto {
  @IsNumber({ maxDecimalPlaces: 3 })
  quantity: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  minimumAlert?: number;
}

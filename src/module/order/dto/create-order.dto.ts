import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderItemInputDto {
  @IsString()
  menuItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @IsInt()
  @Min(1)
  tableNumber: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];
}

export class UpdateOrderStatusDto {
  // PENDING -> CONFIRMED -> PREPARING -> DONE  |  * -> CANCELLED
  @IsString()
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'DONE' | 'CANCELLED';

  @IsOptional()
  @IsString()
  reason?: string;
}

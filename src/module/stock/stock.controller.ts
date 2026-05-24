import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../shared/guards/roles.guard';
import {
  CreateStockMovementDto,
  UpsertStockDto,
} from './dto/stock-movement.dto';
import { StockService } from './stock.service';

@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('stock')
export class StockController {
  constructor(private readonly service: StockService) {}

  @Get()
  list() {
    return this.service.listStock();
  }

  @Get('alerts/low')
  lowStock() {
    return this.service.lowStockAlerts();
  }

  @Get('movements')
  movements(@Query('ingredientId') ingredientId?: string) {
    return this.service.listMovements(ingredientId);
  }

  @Put('ingredients/:ingredientId')
  upsert(@Param('ingredientId') ingredientId: string, @Body() dto: UpsertStockDto) {
    return this.service.upsertStock(ingredientId, dto);
  }

  @Post('ingredients/:ingredientId/movements')
  movement(
    @Param('ingredientId') ingredientId: string,
    @Body() dto: CreateStockMovementDto,
  ) {
    return this.service.registerMovement(ingredientId, dto);
  }
}

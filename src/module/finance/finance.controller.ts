import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../shared/guards/roles.guard';
import {
  CreateFinanceCategoryDto,
  UpdateFinanceCategoryDto,
} from './dto/finance-category.dto';
import {
  CashFlowQueryDto,
  CreateTransactionDto,
} from './dto/transaction.dto';
import { FinanceService } from './finance.service';

@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('finance')
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  // ===== Categorias =====
  @Get('categories')
  listCategories() {
    return this.service.listCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateFinanceCategoryDto) {
    return this.service.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateFinanceCategoryDto) {
    return this.service.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  removeCategory(@Param('id') id: string) {
    return this.service.removeCategory(id);
  }

  // ===== Transações =====
  @Get('transactions')
  listTransactions(@Query() query: CashFlowQueryDto) {
    return this.service.listTransactions(query);
  }

  @Post('transactions')
  createTransaction(@Body() dto: CreateTransactionDto) {
    return this.service.createTransaction(dto);
  }

  @Delete('transactions/:id')
  removeTransaction(@Param('id') id: string) {
    return this.service.removeTransaction(id);
  }

  // ===== Fluxo de Caixa =====
  @Get('cash-flow')
  cashFlow(@Query() query: CashFlowQueryDto) {
    return this.service.cashFlow(query);
  }
}

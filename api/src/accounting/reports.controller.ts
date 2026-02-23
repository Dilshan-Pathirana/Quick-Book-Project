import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ReportsService } from './reports.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Roles('OWNER', 'ACCOUNTANT')
  @Get('profit-loss')
  profitLoss() {
    return this.reports.profitLoss();
  }

  @Roles('OWNER', 'ACCOUNTANT')
  @Get('balance-sheet')
  balanceSheet() {
    return this.reports.balanceSheet();
  }

  @Roles('OWNER', 'ACCOUNTANT')
  @Get('cash-flow')
  cashFlow() {
    return this.reports.cashFlow();
  }

  @Roles('OWNER', 'ACCOUNTANT')
  @Get('vat-summary')
  vatSummary() {
    return this.reports.vatSummary();
  }
}

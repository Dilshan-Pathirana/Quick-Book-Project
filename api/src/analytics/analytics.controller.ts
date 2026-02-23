import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';

@UseGuards(AuthGuard('jwt'))
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('dashboard')
  dashboard() {
    return this.analytics.dashboard();
  }

  @Get('revenue')
  revenue(@Query('from') from: string, @Query('to') to: string) {
    return this.analytics.revenue(from, to);
  }

  @Get('equipment/performance')
  equipmentPerformance() {
    return this.analytics.equipmentPerformance();
  }

  @Get('equipment/:id/trend')
  equipmentTrend(@Param('id') id: string) {
    return this.analytics.equipmentTrend(id);
  }

  @Get('equipment/best')
  best() {
    return this.analytics.bestEquipment();
  }

  @Get('equipment/worst')
  worst() {
    return this.analytics.worstEquipment();
  }

  @Get('customers/top')
  topCustomers() {
    return this.analytics.topCustomers();
  }
}

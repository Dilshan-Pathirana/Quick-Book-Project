import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { MaintenanceService } from './maintenance.service';

@UseGuards(AuthGuard('jwt'))
@Controller('equipment/:id/maintenance')
export class MaintenanceController {
  constructor(private readonly maintenance: MaintenanceService) {}

  @Post()
  create(
    @Param('id') equipmentId: string,
    @Body() dto: CreateMaintenanceDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.maintenance.create(equipmentId, dto, user.id);
  }

  @Get()
  list(@Param('id') equipmentId: string) {
    return this.maintenance.list(equipmentId);
  }
}

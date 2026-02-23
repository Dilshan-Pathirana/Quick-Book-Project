import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateRentalDto } from './dto/create-rental.dto';
import { ReportDamageDto } from './dto/report-damage.dto';
import { RentalsService } from './rentals.service';

@UseGuards(AuthGuard('jwt'))
@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentals: RentalsService) {}

  @Get()
  list() {
    return this.rentals.list();
  }

  @Post()
  create(@Body() dto: CreateRentalDto) {
    return this.rentals.create(dto);
  }

  @Put(':id/mark-out')
  markOut(@Param('id') id: string, @Body() body: { conditionOut?: string }) {
    return this.rentals.markOut(id, body?.conditionOut);
  }

  @Put(':id/mark-returned')
  markReturned(@Param('id') id: string, @Body() body: { conditionIn?: string }) {
    return this.rentals.markReturned(id, body);
  }

  @Put(':id/report-damage')
  reportDamage(@Param('id') id: string, @Body() dto: ReportDamageDto) {
    return this.rentals.reportDamage(id, dto);
  }
}

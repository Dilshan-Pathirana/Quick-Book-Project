import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentService } from './equipment.service';

@UseGuards(AuthGuard('jwt'))
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipment: EquipmentService) {}

  @Get()
  list() {
    return this.equipment.list();
  }

  @Post()
  create(@Body() dto: CreateEquipmentDto) {
    return this.equipment.create(dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.equipment.get(id);
  }

  @Get(':id/rental-history')
  rentalHistory(@Param('id') id: string) {
    return this.equipment.rentalHistory(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEquipmentDto) {
    return this.equipment.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.equipment.remove(id);
  }

  @Get(':id/availability')
  availability(
    @Param('id') id: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.equipment.availability(id, start, end);
  }
}

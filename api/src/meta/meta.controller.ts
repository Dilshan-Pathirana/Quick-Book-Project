import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(AuthGuard('jwt'))
@Controller('meta')
export class MetaController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('equipment-categories')
  equipmentCategories() {
    return this.prisma.equipmentCategory.findMany({ orderBy: { name: 'asc' } });
  }

  @Get('warehouses')
  warehouses() {
    return this.prisma.warehouse.findMany({ orderBy: { name: 'asc' } });
  }
}

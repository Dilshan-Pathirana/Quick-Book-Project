import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { EquipmentStatus, Prisma } from '@prisma/client';

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(equipmentId: string, dto: CreateMaintenanceDto, userId?: string) {
    const equipment = await this.prisma.equipment.findUnique({ where: { id: equipmentId } });
    if (!equipment) throw new NotFoundException('Equipment not found');

    const log = await this.prisma.equipmentMaintenanceLog.create({
      data: {
        equipmentId,
        maintenanceDate: new Date(dto.maintenanceDate),
        description: dto.description,
        cost: dto.cost ? new Prisma.Decimal(dto.cost) : undefined,
        downtimeStart: dto.downtimeStart ? new Date(dto.downtimeStart) : undefined,
        downtimeEnd: dto.downtimeEnd ? new Date(dto.downtimeEnd) : undefined,
        createdById: userId,
      },
    });

    if (dto.downtimeStart) {
      await this.prisma.equipment.update({
        where: { id: equipmentId },
        data: { status: EquipmentStatus.MAINTENANCE },
      });
    }

    return log;
  }

  async list(equipmentId: string) {
    const equipment = await this.prisma.equipment.findUnique({ where: { id: equipmentId } });
    if (!equipment) throw new NotFoundException('Equipment not found');

    return this.prisma.equipmentMaintenanceLog.findMany({
      where: { equipmentId },
      orderBy: { maintenanceDate: 'desc' },
      take: 100,
    });
  }
}

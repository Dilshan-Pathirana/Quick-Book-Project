import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import {
  DepreciationMethod,
  EquipmentStatus,
  Prisma,
} from '@prisma/client';

function parseDate(value: string): Date {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new BadRequestException('Invalid date');
  return d;
}

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.equipment.findMany({
      include: { category: true, warehouse: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async get(id: string) {
    const item = await this.prisma.equipment.findUnique({
      where: { id },
      include: { category: true, warehouse: true },
    });
    if (!item) throw new NotFoundException('Equipment not found');
    return item;
  }

  create(dto: CreateEquipmentDto) {
    return this.prisma.equipment.create({
      data: {
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        isActive: dto.isActive,
        serialNumber: dto.serialNumber,
        internalCode: dto.internalCode,
        purchaseCost: dto.purchaseCost ? new Prisma.Decimal(dto.purchaseCost) : undefined,
        replacementValue: dto.replacementValue
          ? new Prisma.Decimal(dto.replacementValue)
          : undefined,
        dailyRate: dto.dailyRate ? new Prisma.Decimal(dto.dailyRate) : undefined,
        hourlyRate: dto.hourlyRate ? new Prisma.Decimal(dto.hourlyRate) : undefined,
        status: dto.status ? (dto.status as EquipmentStatus) : undefined,
        warehouseId: dto.warehouseId,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        depreciationMethod: dto.depreciationMethod
          ? (dto.depreciationMethod as DepreciationMethod)
          : undefined,
        depreciationRate: dto.depreciationRate
          ? new Prisma.Decimal(dto.depreciationRate)
          : undefined,
        conditionNotes: dto.conditionNotes,
        locationLabel: dto.locationLabel,
      },
    });
  }

  update(id: string, dto: UpdateEquipmentDto) {
    return this.prisma.equipment.update({
      where: { id },
      data: {
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        isActive: dto.isActive,
        serialNumber: dto.serialNumber,
        internalCode: dto.internalCode,
        purchaseCost: dto.purchaseCost ? new Prisma.Decimal(dto.purchaseCost) : undefined,
        replacementValue: dto.replacementValue
          ? new Prisma.Decimal(dto.replacementValue)
          : undefined,
        dailyRate: dto.dailyRate ? new Prisma.Decimal(dto.dailyRate) : undefined,
        hourlyRate: dto.hourlyRate ? new Prisma.Decimal(dto.hourlyRate) : undefined,
        status: dto.status ? (dto.status as EquipmentStatus) : undefined,
        warehouseId: dto.warehouseId,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        depreciationMethod: dto.depreciationMethod
          ? (dto.depreciationMethod as DepreciationMethod)
          : undefined,
        depreciationRate: dto.depreciationRate
          ? new Prisma.Decimal(dto.depreciationRate)
          : undefined,
        conditionNotes: dto.conditionNotes,
        locationLabel: dto.locationLabel,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.equipment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Equipment not found');
    await this.prisma.equipment.delete({ where: { id } });
    return { ok: true };
  }

  async availability(id: string, start: string, end: string) {
    const equipment = await this.prisma.equipment.findUnique({ where: { id } });
    if (!equipment) throw new NotFoundException('Equipment not found');

    const startDate = parseDate(start);
    const endDate = parseDate(end);
    if (endDate < startDate) throw new BadRequestException('end must be after start');

    const conflictingRentals = await this.prisma.rental.findMany({
      where: {
        equipmentId: id,
        status: { in: ['RESERVED', 'OUT'] },
        rentalStart: { lte: endDate },
        rentalEnd: { gte: startDate },
      },
      orderBy: { rentalStart: 'asc' },
      take: 50,
    });

    const conflictingMaintenance = await this.prisma.equipmentMaintenanceLog.findMany({
      where: {
        equipmentId: id,
        OR: [
          {
            downtimeStart: { lte: endDate },
            downtimeEnd: { gte: startDate },
          },
          {
            downtimeStart: { lte: endDate },
            downtimeEnd: null,
          },
        ],
      },
      orderBy: { maintenanceDate: 'desc' },
      take: 50,
    });

    const available = conflictingRentals.length === 0 && conflictingMaintenance.length === 0;

    return {
      equipmentId: id,
      start: startDate,
      end: endDate,
      available,
      conflicts: {
        rentals: conflictingRentals,
        maintenance: conflictingMaintenance,
      },
    };
  }

  async rentalHistory(id: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      include: { category: true, warehouse: true },
    });
    if (!equipment) throw new NotFoundException('Equipment not found');

    const rentals = await this.prisma.rental.findMany({
      where: { equipmentId: id },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            customer: {
              select: {
                id: true,
                fullName: true,
                companyName: true,
                phone: true,
                whatsappNumber: true,
                email: true,
              },
            },
            items: {
              where: { equipmentId: id },
              select: { lineTotal: true },
            },
          },
        },
      },
      orderBy: { rentalStart: 'desc' },
      take: 200,
    });

    return {
      equipment,
      rentals: rentals.map((r) => {
        const paidCost = (r.invoice?.items ?? []).reduce(
          (sum, item) => sum.add(item.lineTotal),
          new Prisma.Decimal(0),
        );

        return {
          id: r.id,
          status: r.status,
          rentalStart: r.rentalStart,
          rentalEnd: r.rentalEnd,
          actualReturnDate: r.actualReturnDate,
          returnedOn: r.actualReturnDate,
          conditionOut: r.conditionOut,
          conditionIn: r.conditionIn,
          specialRemarks: r.damageNotes,
          damageNotes: r.damageNotes,
          invoice: r.invoice
            ? {
                id: r.invoice.id,
                invoiceNumber: r.invoice.invoiceNumber,
                invoiceDate: r.invoice.invoiceDate,
                customer: r.invoice.customer,
                paidCost,
              }
            : null,
        };
      }),
    };
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EquipmentStatus, RentalStatus } from '@prisma/client';
import { CreateRentalDto } from './dto/create-rental.dto';

@Injectable()
export class RentalsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.rental.findMany({
      include: { invoice: true, equipment: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async create(dto: CreateRentalDto) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: dto.invoiceId } });
    if (!invoice) throw new BadRequestException('Invalid invoiceId');

    const equipment = await this.prisma.equipment.findUnique({
      where: { id: dto.equipmentId },
    });
    if (!equipment) throw new BadRequestException('Invalid equipmentId');

    const start = new Date(dto.rentalStart);
    const end = new Date(dto.rentalEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      throw new BadRequestException('Invalid rental period');
    }

    const conflicts = await this.prisma.rental.count({
      where: {
        equipmentId: dto.equipmentId,
        status: { in: ['RESERVED', 'OUT'] },
        rentalStart: { lte: end },
        rentalEnd: { gte: start },
      },
    });
    if (conflicts > 0) throw new BadRequestException('Equipment already booked');

    const rental = await this.prisma.rental.create({
      data: {
        invoiceId: dto.invoiceId,
        equipmentId: dto.equipmentId,
        rentalStart: start,
        rentalEnd: end,
        status: RentalStatus.RESERVED,
      },
    });

    await this.prisma.equipment.update({
      where: { id: dto.equipmentId },
      data: { status: EquipmentStatus.RESERVED },
    });

    return rental;
  }

  async markOut(id: string, conditionOut?: string) {
    const rental = await this.prisma.rental.findUnique({ where: { id } });
    if (!rental) throw new NotFoundException('Rental not found');

    const updated = await this.prisma.rental.update({
      where: { id },
      data: { status: RentalStatus.OUT, conditionOut },
    });

    await this.prisma.equipment.update({
      where: { id: rental.equipmentId },
      data: { status: EquipmentStatus.RENTED },
    });

    return updated;
  }

  async markReturned(id: string, params?: { conditionIn?: string }) {
    const rental = await this.prisma.rental.findUnique({ where: { id } });
    if (!rental) throw new NotFoundException('Rental not found');

    const updated = await this.prisma.rental.update({
      where: { id },
      data: {
        status: RentalStatus.RETURNED,
        conditionIn: params?.conditionIn,
        actualReturnDate: new Date(),
      },
    });

    await this.prisma.equipment.update({
      where: { id: rental.equipmentId },
      data: { status: EquipmentStatus.AVAILABLE },
    });

    return updated;
  }

  async reportDamage(id: string, params?: { damageNotes?: string; conditionIn?: string }) {
    const rental = await this.prisma.rental.findUnique({ where: { id } });
    if (!rental) throw new NotFoundException('Rental not found');

    const updated = await this.prisma.rental.update({
      where: { id },
      data: {
        status: RentalStatus.DAMAGED,
        damageNotes: params?.damageNotes,
        conditionIn: params?.conditionIn,
        actualReturnDate: new Date(),
      },
    });

    await this.prisma.equipment.update({
      where: { id: rental.equipmentId },
      data: { status: EquipmentStatus.MAINTENANCE },
    });

    return updated;
  }
}

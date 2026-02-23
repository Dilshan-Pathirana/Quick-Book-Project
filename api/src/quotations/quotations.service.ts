import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VatService } from '../common/services/vat.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { Prisma, QuotationStatus } from '@prisma/client';

function makeQuotationNumber() {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `QT-${ymd}-${rand}`;
}

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vat: VatService,
  ) {}

  list() {
    return this.prisma.quotation.findMany({
      include: { customer: true, items: { include: { equipment: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async get(id: string) {
    const q = await this.prisma.quotation.findUnique({
      where: { id },
      include: { customer: true, items: { include: { equipment: true } } },
    });
    if (!q) throw new NotFoundException('Quotation not found');
    return q;
  }

  async create(dto: CreateQuotationDto, createdById?: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) throw new BadRequestException('Invalid customerId');

    const start = new Date(dto.rentalStartDate);
    const end = new Date(dto.rentalEndDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      throw new BadRequestException('Invalid rental period');
    }

    const equipmentIds = [...new Set(dto.items.map((i) => i.equipmentId))];
    const equipment = await this.prisma.equipment.findMany({
      where: { id: { in: equipmentIds } },
      select: { id: true, status: true },
    });

    if (equipment.length !== equipmentIds.length) {
      throw new BadRequestException('One or more equipmentId values are invalid');
    }

    const conflicts = await this.prisma.rental.findMany({
      where: {
        equipmentId: { in: equipmentIds },
        status: { in: ['RESERVED', 'OUT'] },
        rentalStart: { lte: end },
        rentalEnd: { gte: start },
      },
      select: { equipmentId: true, rentalStart: true, rentalEnd: true, status: true },
      take: 200,
    });

    if (conflicts.length > 0) {
      throw new BadRequestException({
        message: 'Equipment not available for the selected period',
        conflicts,
      });
    }

    const deliveryFee = dto.deliveryFee ? new Prisma.Decimal(dto.deliveryFee) : new Prisma.Decimal(0);
    const operatorFee = dto.operatorFee ? new Prisma.Decimal(dto.operatorFee) : new Prisma.Decimal(0);
    const discount = dto.discount ? new Prisma.Decimal(dto.discount) : new Prisma.Decimal(0);
    const securityDeposit = dto.securityDeposit
      ? new Prisma.Decimal(dto.securityDeposit)
      : undefined;

    const itemCreates = dto.items.map((item) => {
      const quantity = item.quantity ?? 1;
      const rentalDays = item.rentalDays ?? 1;
      const manualPrice = new Prisma.Decimal(item.manualPrice ?? '0');
      const lineTotal = manualPrice.mul(quantity).mul(rentalDays);
      return {
        equipmentId: item.equipmentId,
        quantity,
        manualPrice,
        rentalDays,
        lineTotal,
      };
    });

    const itemsSubtotal = itemCreates.reduce(
      (sum, i) => sum.add(i.lineTotal),
      new Prisma.Decimal(0),
    );

    const subtotal = itemsSubtotal.add(deliveryFee).add(operatorFee);
    const taxable = subtotal.sub(discount);
    const vatAmount = this.vat.calculateVat(taxable);
    const totalAmount = taxable.add(vatAmount);

    return this.prisma.quotation.create({
      data: {
        quotationNumber: makeQuotationNumber(),
        customerId: dto.customerId,
        rentalStartDate: start,
        rentalEndDate: end,
        status: QuotationStatus.DRAFT,
        deliveryFee,
        operatorFee,
        securityDeposit,
        subtotal,
        vatAmount,
        discount,
        totalAmount,
        createdById,
        items: {
          create: itemCreates,
        },
      },
      include: { customer: true, items: { include: { equipment: true } } },
    });
  }

  async update(id: string, dto: UpdateQuotationDto) {
    const existing = await this.prisma.quotation.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) throw new NotFoundException('Quotation not found');

    const deliveryFee = dto.deliveryFee
      ? new Prisma.Decimal(dto.deliveryFee)
      : existing.deliveryFee ?? new Prisma.Decimal(0);
    const operatorFee = dto.operatorFee
      ? new Prisma.Decimal(dto.operatorFee)
      : existing.operatorFee ?? new Prisma.Decimal(0);
    const discount = dto.discount
      ? new Prisma.Decimal(dto.discount)
      : existing.discount ?? new Prisma.Decimal(0);

    const itemsSubtotal = existing.items.reduce(
      (sum, i) => sum.add(i.lineTotal),
      new Prisma.Decimal(0),
    );

    const subtotal = itemsSubtotal.add(deliveryFee).add(operatorFee);
    const taxable = subtotal.sub(discount);
    const vatAmount = this.vat.calculateVat(taxable);
    const totalAmount = taxable.add(vatAmount);

    return this.prisma.quotation.update({
      where: { id },
      data: {
        customerId: dto.customerId,
        rentalStartDate: dto.rentalStartDate ? new Date(dto.rentalStartDate) : undefined,
        rentalEndDate: dto.rentalEndDate ? new Date(dto.rentalEndDate) : undefined,
        status: dto.status ? (dto.status as QuotationStatus) : undefined,
        deliveryFee: dto.deliveryFee ? new Prisma.Decimal(dto.deliveryFee) : undefined,
        operatorFee: dto.operatorFee ? new Prisma.Decimal(dto.operatorFee) : undefined,
        securityDeposit: dto.securityDeposit
          ? new Prisma.Decimal(dto.securityDeposit)
          : undefined,
        discount: dto.discount ? new Prisma.Decimal(dto.discount) : undefined,
        subtotal,
        vatAmount,
        totalAmount,
      },
      include: { customer: true, items: { include: { equipment: true } } },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.quotation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Quotation not found');
    await this.prisma.quotation.delete({ where: { id } });
    return { ok: true };
  }
}

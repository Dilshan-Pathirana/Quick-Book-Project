import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerType, Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(search?: string) {
    const where: Prisma.CustomerWhereInput | undefined = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { companyName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined;

    const customers = await this.prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return customers;
  }

  autocomplete(q: string) {
    if (!q || q.trim().length < 1) {
      throw new BadRequestException('q is required');
    }

    return this.prisma.customer.findMany({
      where: {
        OR: [
          { fullName: { startsWith: q, mode: 'insensitive' } },
          { companyName: { startsWith: q, mode: 'insensitive' } },
          { phone: { startsWith: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { fullName: 'asc' },
      take: 10,
    });
  }

  async get(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  create(dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        customerType: dto.customerType as CustomerType,
        fullName: dto.fullName,
        companyName: dto.companyName,
        nicOrBr: dto.nicOrBr,
        email: dto.email,
        phone: dto.phone,
        whatsappNumber: dto.whatsappNumber,
        address: dto.address,
        creditLimit: dto.creditLimit ? new Prisma.Decimal(dto.creditLimit) : undefined,
        notes: dto.notes,
      },
    });
  }

  update(id: string, dto: UpdateCustomerDto) {
    return this.prisma.customer.update({
      where: { id },
      data: {
        customerType: dto.customerType ? (dto.customerType as CustomerType) : undefined,
        fullName: dto.fullName,
        companyName: dto.companyName,
        nicOrBr: dto.nicOrBr,
        email: dto.email,
        phone: dto.phone,
        whatsappNumber: dto.whatsappNumber,
        address: dto.address,
        creditLimit: dto.creditLimit ? new Prisma.Decimal(dto.creditLimit) : undefined,
        notes: dto.notes,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Customer not found');
    await this.prisma.customer.delete({ where: { id } });
    return { ok: true };
  }

  async transactions(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');

    const invoices = await this.prisma.invoice.findMany({
      where: { customerId: id },
      include: {
        payments: true,
      },
      orderBy: { invoiceDate: 'desc' },
    });

    const totals = invoices.reduce(
      (acc, inv) => {
        acc.totalRevenue = acc.totalRevenue.add(inv.totalAmount);
        acc.totalOutstanding = acc.totalOutstanding.add(inv.balanceDue);
        return acc;
      },
      {
        totalRevenue: new Prisma.Decimal(0),
        totalOutstanding: new Prisma.Decimal(0),
      },
    );

    return { customer, invoices, totals };
  }
}

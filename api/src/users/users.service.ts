import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RoleName } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isActive: true,
        role: { select: { name: true } },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isActive: true,
        role: { select: { name: true, description: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async history(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isActive: true,
        role: { select: { name: true, description: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const activity = await this.prisma.activityLog.findMany({
      where: { userId: id },
      orderBy: { timestamp: 'desc' },
      take: 200,
    });

    const [quotations, invoices, payments, maintenanceLogs, journalEntries] =
      await Promise.all([
        this.prisma.quotation.findMany({
          where: { createdById: id },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            quotationNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            customer: { select: { id: true, fullName: true } },
          },
        }),
        this.prisma.invoice.findMany({
          where: { createdById: id },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            totalAmount: true,
            balanceDue: true,
            createdAt: true,
            customer: { select: { id: true, fullName: true } },
          },
        }),
        this.prisma.payment.findMany({
          where: { recordedById: id },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            paymentDate: true,
            paymentMethod: true,
            amount: true,
            createdAt: true,
            invoice: { select: { id: true, invoiceNumber: true } },
          },
        }),
        this.prisma.equipmentMaintenanceLog.findMany({
          where: { createdById: id },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            maintenanceDate: true,
            cost: true,
            createdAt: true,
            equipment: { select: { id: true, name: true } },
          },
        }),
        this.prisma.journalEntry.findMany({
          where: { createdById: id },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            entryNumber: true,
            referenceType: true,
            referenceId: true,
            entryDate: true,
            createdAt: true,
          },
        }),
      ]);

    return {
      user,
      activity,
      created: {
        quotations,
        invoices,
        payments,
        maintenanceLogs,
        journalEntries,
      },
    };
  }

  async create(dto: CreateUserDto) {
    const roleName = dto.roleName as RoleName;
    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) throw new BadRequestException('Invalid roleName');

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        roleId: role.id,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isActive: true,
        role: { select: { name: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    let passwordHash: string | undefined;
    if (dto.password) passwordHash = await bcrypt.hash(dto.password, 10);

    let roleId: string | undefined;
    if (dto.roleName) {
      const role = await this.prisma.role.findUnique({
        where: { name: dto.roleName as RoleName },
      });
      if (!role) throw new BadRequestException('Invalid roleName');
      roleId = role.id;
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        isActive: dto.isActive,
        ...(passwordHash ? { passwordHash } : {}),
        ...(roleId ? { roleId } : {}),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isActive: true,
        role: { select: { name: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }

  roles() {
    return this.prisma.role.findMany({ orderBy: { name: 'asc' } });
  }
}

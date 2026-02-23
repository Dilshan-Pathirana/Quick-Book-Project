import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AccountType,
  JournalReferenceType,
  Prisma,
} from '@prisma/client';

function makeEntryNumber() {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `JE-${ymd}-${rand}`;
}

@Injectable()
export class AccountingService {
  constructor(private readonly prisma: PrismaService) {}

  listAccounts() {
    return this.prisma.chartOfAccount.findMany({
      orderBy: [{ accountType: 'asc' }, { accountCode: 'asc' }],
    });
  }

  createAccount(data: {
    accountCode: string;
    accountName: string;
    accountType: AccountType;
    parentAccountId?: string;
  }) {
    return this.prisma.chartOfAccount.create({
      data: {
        accountCode: data.accountCode,
        accountName: data.accountName,
        accountType: data.accountType,
        parentAccountId: data.parentAccountId,
      },
    });
  }

  listJournalEntries() {
    return this.prisma.journalEntry.findMany({
      include: { lines: { include: { account: true } } },
      orderBy: { entryDate: 'desc' },
      take: 200,
    });
  }

  getJournalEntry(id: string) {
    return this.prisma.journalEntry.findUnique({
      where: { id },
      include: { lines: { include: { account: true } } },
    });
  }

  async createManualEntry(params: {
    referenceId: string;
    entryDate: Date;
    description?: string;
    createdById?: string;
    lines: Array<{ accountId: string; debitAmount?: string; creditAmount?: string }>;
  }) {
    const debit = params.lines.reduce(
      (sum, l) => sum.add(new Prisma.Decimal(l.debitAmount ?? '0')),
      new Prisma.Decimal(0),
    );
    const credit = params.lines.reduce(
      (sum, l) => sum.add(new Prisma.Decimal(l.creditAmount ?? '0')),
      new Prisma.Decimal(0),
    );

    if (!debit.equals(credit)) {
      throw new BadRequestException('Journal entry not balanced');
    }

    return this.prisma.journalEntry.create({
      data: {
        entryNumber: makeEntryNumber(),
        referenceType: JournalReferenceType.MANUAL,
        referenceId: params.referenceId,
        entryDate: params.entryDate,
        description: params.description,
        createdById: params.createdById,
        lines: {
          create: params.lines.map((l) => ({
            accountId: l.accountId,
            debitAmount: new Prisma.Decimal(l.debitAmount ?? '0'),
            creditAmount: new Prisma.Decimal(l.creditAmount ?? '0'),
          })),
        },
      },
      include: { lines: true },
    });
  }

  async createInvoiceJournalEntry(params: {
    invoiceId: string;
    createdById?: string;
    totalAmount: Prisma.Decimal;
    vatAmount: Prisma.Decimal;
    entryDate: Date;
  }) {
    const ar = await this.prisma.chartOfAccount.findUnique({
      where: { accountCode: '1100' },
    });
    const income = await this.prisma.chartOfAccount.findUnique({
      where: { accountCode: '4000' },
    });
    const vat = await this.prisma.chartOfAccount.findUnique({
      where: { accountCode: '2000' },
    });

    if (!ar || !income || !vat) {
      throw new BadRequestException('Chart of accounts not seeded');
    }

    const baseRevenue = params.totalAmount.sub(params.vatAmount);

    const debit = params.totalAmount;
    const credit = baseRevenue.add(params.vatAmount);
    if (!debit.equals(credit)) throw new BadRequestException('Invoice entry not balanced');

    return this.prisma.journalEntry.create({
      data: {
        entryNumber: makeEntryNumber(),
        referenceType: JournalReferenceType.INVOICE,
        referenceId: params.invoiceId,
        invoiceId: params.invoiceId,
        entryDate: params.entryDate,
        description: `Invoice ${params.invoiceId}`,
        createdById: params.createdById,
        lines: {
          create: [
            {
              accountId: ar.id,
              debitAmount: params.totalAmount,
              creditAmount: new Prisma.Decimal(0),
            },
            {
              accountId: income.id,
              debitAmount: new Prisma.Decimal(0),
              creditAmount: baseRevenue,
            },
            {
              accountId: vat.id,
              debitAmount: new Prisma.Decimal(0),
              creditAmount: params.vatAmount,
            },
          ],
        },
      },
    });
  }

  async createPaymentJournalEntry(params: {
    paymentId: string;
    invoiceId: string;
    createdById?: string;
    amount: Prisma.Decimal;
    entryDate: Date;
  }) {
    const cash = await this.prisma.chartOfAccount.findUnique({
      where: { accountCode: '1000' },
    });
    const ar = await this.prisma.chartOfAccount.findUnique({
      where: { accountCode: '1100' },
    });

    if (!cash || !ar) {
      throw new BadRequestException('Chart of accounts not seeded');
    }

    return this.prisma.journalEntry.create({
      data: {
        entryNumber: makeEntryNumber(),
        referenceType: JournalReferenceType.PAYMENT,
        referenceId: params.paymentId,
        paymentId: params.paymentId,
        invoiceId: params.invoiceId,
        entryDate: params.entryDate,
        description: `Payment ${params.paymentId}`,
        createdById: params.createdById,
        lines: {
          create: [
            {
              accountId: cash.id,
              debitAmount: params.amount,
              creditAmount: new Prisma.Decimal(0),
            },
            {
              accountId: ar.id,
              debitAmount: new Prisma.Decimal(0),
              creditAmount: params.amount,
            },
          ],
        },
      },
    });
  }
}

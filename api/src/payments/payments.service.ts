import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountingService } from '../accounting/accounting.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { InvoiceStatus, PaymentMethod, Prisma } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounting: AccountingService,
  ) {}

  async create(dto: CreatePaymentDto, recordedById?: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: dto.invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const amount = new Prisma.Decimal(dto.amount);
    if (amount.lte(0)) throw new BadRequestException('amount must be > 0');
    if (amount.gt(invoice.balanceDue)) throw new BadRequestException('amount exceeds balanceDue');

    const paymentDate = new Date(dto.paymentDate);

    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          invoiceId: dto.invoiceId,
          paymentDate,
          paymentMethod: dto.paymentMethod as PaymentMethod,
          amount,
          referenceNumber: dto.referenceNumber,
          recordedById,
        },
      });

      const updatedPaid = invoice.amountPaid.add(amount);
      const updatedBalance = invoice.balanceDue.sub(amount);

      const status = updatedBalance.equals(0)
        ? InvoiceStatus.PAID
        : InvoiceStatus.PARTIAL;

      await tx.invoice.update({
        where: { id: dto.invoiceId },
        data: {
          amountPaid: updatedPaid,
          balanceDue: updatedBalance,
          status,
        },
      });

      return created;
    });

    await this.accounting.createPaymentJournalEntry({
      paymentId: payment.id,
      invoiceId: dto.invoiceId,
      createdById: recordedById,
      amount: new Prisma.Decimal(dto.amount),
      entryDate: paymentDate,
    });

    return payment;
  }

  async get(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  byInvoice(invoiceId: string) {
    return this.prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { paymentDate: 'desc' },
    });
  }
}

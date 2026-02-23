import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VatService } from '../common/services/vat.service';
import { AccountingService } from '../accounting/accounting.service';
import { PdfService } from '../pdf/pdf.service';
import { EmailService } from '../notifications/email.service';
import { WhatsappService } from '../notifications/whatsapp.service';
import { ConfigService } from '@nestjs/config';
import {
  DeliveryChannel,
  DeliveryStatus,
  EntityType,
  InvoiceStatus,
  Prisma,
  QuotationStatus,
} from '@prisma/client';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

function makeInvoiceNumber() {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `INV-${ymd}-${rand}`;
}

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vat: VatService,
    private readonly accounting: AccountingService,
    private readonly pdf: PdfService,
    private readonly email: EmailService,
    private readonly whatsapp: WhatsappService,
    private readonly config: ConfigService,
  ) {}

  list() {
    return this.prisma.invoice.findMany({
      include: { customer: true, items: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async get(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { customer: true, items: { include: { equipment: true } }, payments: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async create(dto: CreateInvoiceDto, createdById?: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) throw new BadRequestException('Invalid customerId');

    const deliveryFee = dto.deliveryFee ? new Prisma.Decimal(dto.deliveryFee) : new Prisma.Decimal(0);
    const operatorFee = dto.operatorFee ? new Prisma.Decimal(dto.operatorFee) : new Prisma.Decimal(0);
    const discount = dto.discount ? new Prisma.Decimal(dto.discount) : new Prisma.Decimal(0);
    const securityDeposit = dto.securityDeposit
      ? new Prisma.Decimal(dto.securityDeposit)
      : undefined;

    const itemsCreate = dto.items.map((item) => {
      const quantity = item.quantity ?? 1;
      const unitPrice = new Prisma.Decimal(item.unitPrice);
      const lineTotal = unitPrice.mul(quantity);
      return {
        equipmentId: item.equipmentId,
        description: item.description,
        quantity,
        unitPrice,
        lineTotal,
      };
    });

    const itemsSubtotal = itemsCreate.reduce(
      (sum, i) => sum.add(i.lineTotal),
      new Prisma.Decimal(0),
    );

    const subtotal = itemsSubtotal.add(deliveryFee).add(operatorFee);
    const taxable = subtotal.sub(discount);
    const vatAmount = this.vat.calculateVat(taxable);
    const totalAmount = taxable.add(vatAmount);

    const invoiceDate = dto.invoiceDate ? new Date(dto.invoiceDate) : new Date();
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber: makeInvoiceNumber(),
        customerId: dto.customerId,
        invoiceDate,
        dueDate,
        status: InvoiceStatus.DRAFT,
        deliveryFee,
        operatorFee,
        securityDeposit,
        subtotal,
        vatAmount,
        discount,
        totalAmount,
        amountPaid: new Prisma.Decimal(0),
        balanceDue: totalAmount,
        createdById,
        items: { create: itemsCreate },
      },
      include: { items: true },
    });

    await this.accounting.createInvoiceJournalEntry({
      invoiceId: invoice.id,
      createdById,
      totalAmount: invoice.totalAmount,
      vatAmount: invoice.vatAmount,
      entryDate: invoice.invoiceDate,
    });

    return invoice;
  }

  async createFromQuotation(quotationId: string, createdById?: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { items: true },
    });
    if (!quotation) throw new NotFoundException('Quotation not found');
    if (quotation.status === QuotationStatus.CONVERTED) {
      throw new BadRequestException('Quotation already converted');
    }

    const invoice = await this.prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          invoiceNumber: makeInvoiceNumber(),
          customerId: quotation.customerId,
          quotationId: quotation.id,
          invoiceDate: new Date(),
          dueDate: undefined,
          status: InvoiceStatus.DRAFT,
          deliveryFee: quotation.deliveryFee,
          operatorFee: quotation.operatorFee,
          securityDeposit: quotation.securityDeposit,
          subtotal: quotation.subtotal,
          vatAmount: quotation.vatAmount,
          discount: quotation.discount,
          totalAmount: quotation.totalAmount,
          amountPaid: new Prisma.Decimal(0),
          balanceDue: quotation.totalAmount,
          createdById,
          items: {
            create: quotation.items.map((i) => ({
              equipmentId: i.equipmentId,
              description: undefined,
              quantity: i.quantity,
              unitPrice: i.manualPrice ?? new Prisma.Decimal(0),
              lineTotal: i.lineTotal,
            })),
          },
        },
      });

      await tx.rental.createMany({
        data: quotation.items.map((i) => ({
          invoiceId: created.id,
          equipmentId: i.equipmentId,
          rentalStart: quotation.rentalStartDate,
          rentalEnd: quotation.rentalEndDate,
          status: 'RESERVED',
        })),
      });

      await tx.equipment.updateMany({
        where: { id: { in: quotation.items.map((i) => i.equipmentId) } },
        data: { status: 'RESERVED' },
      });

      await tx.quotation.update({
        where: { id: quotationId },
        data: { status: QuotationStatus.CONVERTED },
      });

      return created;
    });

    await this.accounting.createInvoiceJournalEntry({
      invoiceId: invoice.id,
      createdById,
      totalAmount: invoice.totalAmount,
      vatAmount: invoice.vatAmount,
      entryDate: invoice.invoiceDate,
    });

    return invoice;
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    const existing = await this.prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) throw new NotFoundException('Invoice not found');

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

    const amountPaid = existing.amountPaid;
    const balanceDue = totalAmount.sub(amountPaid);

    return this.prisma.invoice.update({
      where: { id },
      data: {
        customerId: dto.customerId,
        invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: dto.status ? (dto.status as InvoiceStatus) : undefined,
        deliveryFee: dto.deliveryFee ? new Prisma.Decimal(dto.deliveryFee) : undefined,
        operatorFee: dto.operatorFee ? new Prisma.Decimal(dto.operatorFee) : undefined,
        securityDeposit: dto.securityDeposit
          ? new Prisma.Decimal(dto.securityDeposit)
          : undefined,
        discount: dto.discount ? new Prisma.Decimal(dto.discount) : undefined,
        subtotal,
        vatAmount,
        totalAmount,
        balanceDue,
      },
      include: { items: true },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Invoice not found');
    await this.prisma.invoice.delete({ where: { id } });
    return { ok: true };
  }

  generatePdf(id: string) {
    return this.pdf.generateInvoicePdf(id);
  }

  async sendEmail(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (!invoice.customer.email) throw new BadRequestException('Customer email missing');

    if (!invoice.pdfUrl) await this.generatePdf(id);

    const updated = await this.prisma.invoice.findUnique({ where: { id } });
    if (!updated?.pdfUrl) throw new BadRequestException('PDF generation failed');

    const subject = `Invoice ${invoice.invoiceNumber}`;
    const text = `Dear ${invoice.customer.fullName}, please find your rental invoice. Thank you.`;

    const result = await this.email.sendMail({
      to: invoice.customer.email,
      subject,
      text,
      attachments: invoice.pdfUrl
        ? [{ filename: `${invoice.invoiceNumber}.pdf`, path: invoice.pdfUrl }]
        : undefined,
    });

    await this.prisma.deliveryLog.create({
      data: {
        entityType: EntityType.INVOICE,
        entityId: id,
        invoiceId: id,
        channel: DeliveryChannel.EMAIL,
        to: invoice.customer.email,
        status: result.sent ? DeliveryStatus.SENT : DeliveryStatus.FAILED,
        detail: result.sent ? result.messageId : result.reason,
        fileId: updated?.pdfFileId ?? undefined,
      },
    });

    return result;
  }

  async sendWhatsapp(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (!invoice.customer.whatsappNumber) {
      throw new BadRequestException('Customer WhatsApp number missing');
    }

    if (!invoice.pdfUrl) await this.generatePdf(id);

    const updated = await this.prisma.invoice.findUnique({ where: { id } });

    const message = `Dear ${invoice.customer.fullName}, please find your rental invoice. Thank you.`;
    const result = await this.whatsapp.sendMessage({
      to: invoice.customer.whatsappNumber,
      message,
      pdfUrl: updated?.pdfUrl ?? undefined,
    });

    await this.prisma.deliveryLog.create({
      data: {
        entityType: EntityType.INVOICE,
        entityId: id,
        invoiceId: id,
        channel: DeliveryChannel.WHATSAPP,
        to: invoice.customer.whatsappNumber,
        status: result.sent ? DeliveryStatus.SENT : DeliveryStatus.FAILED,
        detail: result.sent ? 'sent' : result.reason,
        fileId: updated?.pdfFileId ?? undefined,
      },
    });

    return result;
  }

  payments(invoiceId: string) {
    return this.prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { paymentDate: 'desc' },
    });
  }
}

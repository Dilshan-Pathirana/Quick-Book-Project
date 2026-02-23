import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PDFDocument from 'pdfkit';
import { createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';

@Injectable()
export class PdfService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
    private readonly config: ConfigService,
  ) {}

  async generateInvoicePdf(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        items: { include: { equipment: true } },
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    const port = this.config.get<number>('PORT') ?? 3002;
    const publicBaseUrl =
      this.config.get<string>('PUBLIC_BASE_URL') ?? `http://localhost:${port}`;
    const apiPrefix = this.config.get<string>('API_GLOBAL_PREFIX') ?? 'api/v1';

    const storageRelPath = join('invoices', `${invoice.invoiceNumber}.pdf`);
    const storageAbsPath = join(this.files.getStorageRoot(), storageRelPath);
    this.files.ensureDir(storageAbsPath);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = createWriteStream(storageAbsPath);
    doc.pipe(stream);

    doc.fontSize(18).text('Invoice', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10);
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.text(`Invoice Date: ${invoice.invoiceDate.toISOString().slice(0, 10)}`);
    if (invoice.dueDate) doc.text(`Due Date: ${invoice.dueDate.toISOString().slice(0, 10)}`);

    doc.moveDown();
    doc.fontSize(12).text('Customer');
    doc.fontSize(10);
    doc.text(invoice.customer.fullName);
    if (invoice.customer.companyName) doc.text(invoice.customer.companyName);
    if (invoice.customer.phone) doc.text(`Phone: ${invoice.customer.phone}`);
    if (invoice.customer.email) doc.text(`Email: ${invoice.customer.email}`);
    if (invoice.customer.address) doc.text(invoice.customer.address);

    doc.moveDown();
    doc.fontSize(12).text('Items');
    doc.moveDown(0.5);
    doc.fontSize(10);

    invoice.items.forEach((item, idx) => {
      const name =
        item.description ??
        item.equipment?.name ??
        (item.equipmentId ? item.equipmentId : 'Item');
      doc.text(
        `${idx + 1}. ${name} | Qty: ${item.quantity} | Unit: ${item.unitPrice.toFixed(2)} | Line: ${item.lineTotal.toFixed(2)}`,
      );
    });

    doc.moveDown();
    doc.fontSize(12).text('Totals', { align: 'right' });
    doc.fontSize(10);
    doc.text(`Subtotal: ${invoice.subtotal.toFixed(2)}`, { align: 'right' });
    doc.text(`Discount: ${invoice.discount.toFixed(2)}`, { align: 'right' });
    doc.text(`VAT: ${invoice.vatAmount.toFixed(2)}`, { align: 'right' });
    doc.text(`Total: ${invoice.totalAmount.toFixed(2)}`, { align: 'right' });
    doc.text(`Paid: ${invoice.amountPaid.toFixed(2)}`, { align: 'right' });
    doc.text(`Balance Due: ${invoice.balanceDue.toFixed(2)}`, { align: 'right' });

    doc.moveDown();
    doc.fontSize(9);
    doc.text('Payment Instructions: (configure in your system settings)', { align: 'left' });
    doc.text('Terms & Conditions: (configure in your system settings)', { align: 'left' });

    doc.end();

    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => resolve());
      stream.on('error', (e) => reject(e));
    });

    const fileRecord = await this.files.createFileRecord({
      storagePath: storageRelPath,
      mimeType: 'application/pdf',
      originalName: `${invoice.invoiceNumber}.pdf`,
    });

    const normalizedBase = publicBaseUrl.replace(/\/+$/, '');
    const normalizedPrefix = apiPrefix.replace(/^\/+/, '').replace(/\/+$/, '');

    const baseWithPrefix =
      normalizedBase.endsWith(`/${normalizedPrefix}`)
        ? normalizedBase
        : `${normalizedBase}/${normalizedPrefix}`;

    const fileUrl = `${baseWithPrefix}/files/${fileRecord.id}`;

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        pdfUrl: fileUrl,
        pdfFileId: fileRecord.id,
      },
    });

    return { fileId: fileRecord.id, url: fileUrl };
  }
}

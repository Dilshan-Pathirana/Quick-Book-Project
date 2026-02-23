import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { WhatsappService } from '../notifications/whatsapp.service';
import {
  DeliveryChannel,
  DeliveryStatus,
  EntityType,
} from '@prisma/client';
import { InvoicesService } from '../invoices/invoices.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { QuotationsService } from './quotations.service';

@UseGuards(AuthGuard('jwt'))
@Controller('quotations')
export class QuotationsController {
  constructor(
    private readonly quotations: QuotationsService,
    private readonly invoices: InvoicesService,
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly whatsapp: WhatsappService,
  ) {}

  @Get()
  list() {
    return this.quotations.list();
  }

  @Post()
  create(@Body() dto: CreateQuotationDto, @CurrentUser() user: { id: string }) {
    return this.quotations.create(dto, user.id);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.quotations.get(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQuotationDto) {
    return this.quotations.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quotations.remove(id);
  }

  @Post(':id/send-email')
  async sendEmail(@Param('id') id: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!quotation) return { sent: false, reason: 'Quotation not found' };
    if (!quotation.customer.email) return { sent: false, reason: 'Customer email missing' };

    const subject = `Quotation ${quotation.quotationNumber}`;
    const text = `Dear ${quotation.customer.fullName}, please find your rental quotation. Thank you.`;

    const result = await this.email.sendMail({
      to: quotation.customer.email,
      subject,
      text,
    });

    await this.prisma.deliveryLog.create({
      data: {
        entityType: EntityType.QUOTATION,
        entityId: id,
        quotationId: id,
        channel: DeliveryChannel.EMAIL,
        to: quotation.customer.email,
        status: result.sent ? DeliveryStatus.SENT : DeliveryStatus.FAILED,
        detail: result.sent ? result.messageId : result.reason,
      },
    });

    return result;
  }

  @Post(':id/send-whatsapp')
  async sendWhatsapp(@Param('id') id: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!quotation) return { sent: false, reason: 'Quotation not found' };
    if (!quotation.customer.whatsappNumber)
      return { sent: false, reason: 'Customer WhatsApp number missing' };

    const message = `Dear ${quotation.customer.fullName}, please find your rental quotation. Thank you.`;
    const result = await this.whatsapp.sendMessage({
      to: quotation.customer.whatsappNumber,
      message,
    });

    await this.prisma.deliveryLog.create({
      data: {
        entityType: EntityType.QUOTATION,
        entityId: id,
        quotationId: id,
        channel: DeliveryChannel.WHATSAPP,
        to: quotation.customer.whatsappNumber,
        status: result.sent ? DeliveryStatus.SENT : DeliveryStatus.FAILED,
        detail: result.sent ? 'sent' : result.reason,
      },
    });

    return result;
  }

  @Post(':id/convert-to-invoice')
  convertToInvoice(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.invoices.createFromQuotation(id, user.id);
  }
}

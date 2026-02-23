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
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoicesService } from './invoices.service';

@UseGuards(AuthGuard('jwt'))
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  list() {
    return this.invoices.list();
  }

  @Post()
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: { id: string }) {
    return this.invoices.create(dto, user.id);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.invoices.get(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoices.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoices.remove(id);
  }

  @Post(':id/generate-pdf')
  generatePdf(@Param('id') id: string) {
    return this.invoices.generatePdf(id);
  }

  @Post(':id/send-email')
  sendEmail(@Param('id') id: string) {
    return this.invoices.sendEmail(id);
  }

  @Post(':id/send-whatsapp')
  sendWhatsapp(@Param('id') id: string) {
    return this.invoices.sendWhatsapp(id);
  }
}

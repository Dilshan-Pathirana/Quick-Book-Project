import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@UseGuards(AuthGuard('jwt'))
@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('payments')
  create(@Body() dto: CreatePaymentDto, @CurrentUser() user: { id: string }) {
    return this.payments.create(dto, user.id);
  }

  @Get('payments/:id')
  get(@Param('id') id: string) {
    return this.payments.get(id);
  }

  @Get('invoices/:id/payments')
  byInvoice(@Param('id') invoiceId: string) {
    return this.payments.byInvoice(invoiceId);
  }
}

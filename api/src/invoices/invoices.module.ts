import { Module } from '@nestjs/common';
import { AccountingModule } from '../accounting/accounting.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PdfModule } from '../pdf/pdf.module';
import { VatService } from '../common/services/vat.service';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [AccountingModule, PdfModule, NotificationsModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, VatService],
  exports: [InvoicesService],
})
export class InvoicesModule {}

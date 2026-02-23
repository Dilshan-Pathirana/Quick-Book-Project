import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { VatService } from '../common/services/vat.service';
import { QuotationsController } from './quotations.controller';
import { QuotationsService } from './quotations.service';

@Module({
  imports: [InvoicesModule, NotificationsModule],
  controllers: [QuotationsController],
  providers: [QuotationsService, VatService],
})
export class QuotationsModule {}

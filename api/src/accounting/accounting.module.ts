import { Module } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { AccountsController } from './accounts.controller';
import { JournalEntriesController } from './journal-entries.controller';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  controllers: [AccountsController, JournalEntriesController, ReportsController],
  providers: [AccountingService, ReportsService],
  exports: [AccountingService],
})
export class AccountingModule {}

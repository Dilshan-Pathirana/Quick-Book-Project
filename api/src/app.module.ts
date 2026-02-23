import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { EquipmentModule } from './equipment/equipment.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { FilesModule } from './files/files.module';
import { PdfModule } from './pdf/pdf.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AccountingModule } from './accounting/accounting.module';
import { QuotationsModule } from './quotations/quotations.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { RentalsModule } from './rentals/rentals.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MetaModule } from './meta/meta.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    EquipmentModule,
    MaintenanceModule,
    FilesModule,
    PdfModule,
    NotificationsModule,
    AccountingModule,
    QuotationsModule,
    InvoicesModule,
    PaymentsModule,
    RentalsModule,
    AnalyticsModule,
    MetaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

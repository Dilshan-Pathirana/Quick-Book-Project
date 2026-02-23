import { IsDateString, IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';

export class UpdateInvoiceDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(['DRAFT', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE'])
  status?: 'DRAFT' | 'SENT' | 'PAID' | 'PARTIAL' | 'OVERDUE';

  @IsOptional()
  @IsNumberString()
  deliveryFee?: string;

  @IsOptional()
  @IsNumberString()
  operatorFee?: string;

  @IsOptional()
  @IsNumberString()
  securityDeposit?: string;

  @IsOptional()
  @IsNumberString()
  discount?: string;
}

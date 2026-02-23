import { IsDateString, IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  invoiceId!: string;

  @IsDateString()
  paymentDate!: string;

  @IsEnum(['CASH', 'BANK', 'TRANSFER', 'WALLET'])
  paymentMethod!: 'CASH' | 'BANK' | 'TRANSFER' | 'WALLET';

  @IsNumberString()
  amount!: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;
}

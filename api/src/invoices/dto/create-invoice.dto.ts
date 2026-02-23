import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumberString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceItemDto } from './invoice-item.dto';

export class CreateInvoiceDto {
  @IsString()
  customerId!: string;

  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

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

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items!: InvoiceItemDto[];
}

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
import { QuotationItemDto } from './quotation-item.dto';

export class CreateQuotationDto {
  @IsString()
  customerId!: string;

  @IsDateString()
  rentalStartDate!: string;

  @IsDateString()
  rentalEndDate!: string;

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
  @Type(() => QuotationItemDto)
  items!: QuotationItemDto[];
}

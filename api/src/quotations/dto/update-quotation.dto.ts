import {
  IsDateString,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateQuotationDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsDateString()
  rentalStartDate?: string;

  @IsOptional()
  @IsDateString()
  rentalEndDate?: string;

  @IsOptional()
  @IsEnum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'CONVERTED'])
  status?: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED';

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

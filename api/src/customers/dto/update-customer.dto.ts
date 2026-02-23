import { IsEmail, IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';

export class UpdateCustomerDto {
  @IsOptional()
  @IsEnum(['INDIVIDUAL', 'COMPANY'])
  customerType?: 'INDIVIDUAL' | 'COMPANY';

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  nicOrBr?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumberString()
  creditLimit?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

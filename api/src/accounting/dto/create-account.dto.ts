import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  accountCode!: string;

  @IsString()
  accountName!: string;

  @IsEnum(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'])
  accountType!: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';

  @IsOptional()
  @IsString()
  parentAccountId?: string;
}

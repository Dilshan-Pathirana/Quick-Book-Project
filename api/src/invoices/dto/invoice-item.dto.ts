import { IsInt, IsNumberString, IsOptional, IsString, Min } from 'class-validator';

export class InvoiceItemDto {
  @IsOptional()
  @IsString()
  equipmentId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsNumberString()
  unitPrice!: string;
}

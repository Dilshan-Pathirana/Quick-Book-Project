import { IsInt, IsNumberString, IsOptional, IsString, Min } from 'class-validator';

export class QuotationItemDto {
  @IsString()
  equipmentId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsNumberString()
  manualPrice?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  rentalDays?: number;
}

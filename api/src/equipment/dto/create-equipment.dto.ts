import {
  IsBoolean,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEquipmentDto {
  @IsString()
  categoryId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsString()
  serialNumber!: string;

  @IsString()
  internalCode!: string;

  @IsOptional()
  @IsNumberString()
  purchaseCost?: string;

  @IsOptional()
  @IsNumberString()
  replacementValue?: string;

  @IsOptional()
  @IsNumberString()
  dailyRate?: string;

  @IsOptional()
  @IsNumberString()
  hourlyRate?: string;

  @IsOptional()
  @IsEnum(['AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE'])
  status?: 'AVAILABLE' | 'RESERVED' | 'RENTED' | 'MAINTENANCE';

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  purchaseDate?: string;

  @IsOptional()
  @IsEnum(['STRAIGHT_LINE', 'REDUCING_BALANCE'])
  depreciationMethod?: 'STRAIGHT_LINE' | 'REDUCING_BALANCE';

  @IsOptional()
  @IsNumberString()
  depreciationRate?: string;

  @IsOptional()
  @IsString()
  conditionNotes?: string;

  @IsOptional()
  @IsString()
  locationLabel?: string;
}

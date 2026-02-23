import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class CreateMaintenanceDto {
  @IsString()
  maintenanceDate!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumberString()
  cost?: string;

  @IsOptional()
  @IsString()
  downtimeStart?: string;

  @IsOptional()
  @IsString()
  downtimeEnd?: string;
}

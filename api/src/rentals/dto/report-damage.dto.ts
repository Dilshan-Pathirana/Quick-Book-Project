import { IsOptional, IsString } from 'class-validator';

export class ReportDamageDto {
  @IsOptional()
  @IsString()
  damageNotes?: string;

  @IsOptional()
  @IsString()
  conditionIn?: string;
}

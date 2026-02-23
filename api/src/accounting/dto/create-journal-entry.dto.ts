import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class JournalLineDto {
  @IsString()
  accountId!: string;

  @IsOptional()
  @IsNumberString()
  debitAmount?: string;

  @IsOptional()
  @IsNumberString()
  creditAmount?: string;
}

export class CreateJournalEntryDto {
  @IsEnum(['MANUAL'])
  referenceType!: 'MANUAL';

  @IsString()
  referenceId!: string;

  @IsDateString()
  entryDate!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines!: JournalLineDto[];
}

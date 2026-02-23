import { IsDateString, IsString } from 'class-validator';

export class CreateRentalDto {
  @IsString()
  invoiceId!: string;

  @IsString()
  equipmentId!: string;

  @IsDateString()
  rentalStart!: string;

  @IsDateString()
  rentalEnd!: string;
}

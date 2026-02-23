import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

@Injectable()
export class VatService {
  constructor(private readonly config: ConfigService) {}

  ratePercent() {
    const raw = this.config.get<string>('VAT_RATE_PERCENT') ?? '0';
    const num = Number(raw);
    return Number.isFinite(num) ? num : 0;
  }

  calculateVat(amount: Prisma.Decimal) {
    const rate = this.ratePercent();
    if (!rate || rate <= 0) return new Prisma.Decimal(0);
    return amount.mul(new Prisma.Decimal(rate)).div(new Prisma.Decimal(100));
  }
}

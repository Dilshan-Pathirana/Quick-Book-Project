import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async profitLoss() {
    const rows = await this.prisma.$queryRaw<
      Array<{
        account_type: string;
        net: string;
      }>
    >`
      SELECT coa.account_type,
             SUM(jl.credit_amount - jl.debit_amount)::text AS net
      FROM journal_lines jl
      JOIN chart_of_accounts coa ON coa.id = jl.account_id
      GROUP BY coa.account_type
    `;

    const income = rows.find((r) => r.account_type === 'INCOME')?.net ?? '0';
    const expense = rows.find((r) => r.account_type === 'EXPENSE')?.net ?? '0';

    return {
      income,
      expense,
      netProfit: (Number(income) - Number(expense)).toFixed(2),
    };
  }

  async balanceSheet() {
    const rows = await this.prisma.$queryRaw<
      Array<{ account_type: string; net: string }>
    >`
      SELECT coa.account_type,
             SUM(jl.debit_amount - jl.credit_amount)::text AS net
      FROM journal_lines jl
      JOIN chart_of_accounts coa ON coa.id = jl.account_id
      GROUP BY coa.account_type
    `;

    const assets = rows.find((r) => r.account_type === 'ASSET')?.net ?? '0';
    const liabilities = rows.find((r) => r.account_type === 'LIABILITY')?.net ?? '0';
    const equity = rows.find((r) => r.account_type === 'EQUITY')?.net ?? '0';

    return { assets, liabilities, equity };
  }

  async cashFlow() {
    const row = await this.prisma.$queryRaw<
      Array<{ cash_net: string }>
    >`
      SELECT SUM(jl.debit_amount - jl.credit_amount)::text AS cash_net
      FROM journal_lines jl
      JOIN chart_of_accounts coa ON coa.id = jl.account_id
      WHERE coa.account_code = '1000'
    `;

    return { cashNet: row[0]?.cash_net ?? '0' };
  }

  async vatSummary() {
    const row = await this.prisma.$queryRaw<
      Array<{ vat_net: string }>
    >`
      SELECT SUM(jl.credit_amount - jl.debit_amount)::text AS vat_net
      FROM journal_lines jl
      JOIN chart_of_accounts coa ON coa.id = jl.account_id
      WHERE coa.account_code = '2000'
    `;

    return { vatPayableNet: row[0]?.vat_net ?? '0' };
  }
}

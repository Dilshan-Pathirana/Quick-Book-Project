import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function parseDate(value: string): Date {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new BadRequestException('Invalid date');
  return d;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const now = new Date();
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const revenueRow = await this.prisma.$queryRaw<
      Array<{ total: string }>
    >`
      SELECT COALESCE(SUM(total_amount), 0)::text AS total
      FROM invoices
      WHERE invoice_date >= ${from}
    `;

    const outstandingRow = await this.prisma.$queryRaw<
      Array<{ total: string }>
    >`
      SELECT COALESCE(SUM(balance_due), 0)::text AS total
      FROM invoices
      WHERE balance_due > 0
    `;

    const invoiceCounts = await this.prisma.invoice.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    return {
      monthFrom: from,
      totalRevenue: revenueRow[0]?.total ?? '0',
      outstandingReceivables: outstandingRow[0]?.total ?? '0',
      invoiceCounts,
    };
  }

  async revenue(from: string, to: string) {
    const fromDate = parseDate(from);
    const toDate = parseDate(to);

    const rows = await this.prisma.$queryRaw<
      Array<{ day: string; total: string }>
    >`
      SELECT to_char(invoice_date::date, 'YYYY-MM-DD') AS day,
             COALESCE(SUM(total_amount), 0)::text AS total
      FROM invoices
      WHERE invoice_date >= ${fromDate} AND invoice_date <= ${toDate}
      GROUP BY invoice_date::date
      ORDER BY invoice_date::date ASC
    `;

    return { from: fromDate, to: toDate, points: rows };
  }

  async equipmentPerformance() {
    const rows = await this.prisma.$queryRaw<
      Array<{
        equipment_id: string;
        equipment_name: string;
        total_revenue: string;
        total_rentals: string;
        maintenance_cost: string;
      }>
    >`
      SELECT e.id AS equipment_id,
             e.name AS equipment_name,
             COALESCE(SUM(ii.line_total), 0)::text AS total_revenue,
             COALESCE(COUNT(r.id), 0)::text AS total_rentals,
             COALESCE((
               SELECT SUM(cost) FROM equipment_maintenance_logs em
               WHERE em.equipment_id = e.id
             ), 0)::text AS maintenance_cost
      FROM equipment e
      LEFT JOIN invoice_items ii ON ii.equipment_id = e.id
      LEFT JOIN rentals r ON r.equipment_id = e.id
      GROUP BY e.id, e.name
      ORDER BY COALESCE(SUM(ii.line_total), 0) DESC
      LIMIT 200
    `;

    return rows;
  }

  async equipmentTrend(equipmentId: string) {
    const rows = await this.prisma.$queryRaw<
      Array<{ month: string; total: string }>
    >`
      SELECT to_char(i.invoice_date, 'YYYY-MM') AS month,
             COALESCE(SUM(ii.line_total), 0)::text AS total
      FROM invoice_items ii
      JOIN invoices i ON i.id = ii.invoice_id
      WHERE ii.equipment_id = ${equipmentId}
      GROUP BY to_char(i.invoice_date, 'YYYY-MM')
      ORDER BY month ASC
    `;

    return { equipmentId, points: rows };
  }

  async bestEquipment() {
    const rows = await this.prisma.$queryRaw<
      Array<{ equipment_id: string; equipment_name: string; total_revenue: string }>
    >`
      SELECT e.id AS equipment_id,
             e.name AS equipment_name,
             COALESCE(SUM(ii.line_total), 0)::text AS total_revenue
      FROM equipment e
      LEFT JOIN invoice_items ii ON ii.equipment_id = e.id
      GROUP BY e.id, e.name
      ORDER BY COALESCE(SUM(ii.line_total), 0) DESC
      LIMIT 20
    `;

    return rows;
  }

  async worstEquipment() {
    const rows = await this.prisma.$queryRaw<
      Array<{ equipment_id: string; equipment_name: string; total_revenue: string }>
    >`
      SELECT e.id AS equipment_id,
             e.name AS equipment_name,
             COALESCE(SUM(ii.line_total), 0)::text AS total_revenue
      FROM equipment e
      LEFT JOIN invoice_items ii ON ii.equipment_id = e.id
      GROUP BY e.id, e.name
      ORDER BY COALESCE(SUM(ii.line_total), 0) ASC
      LIMIT 20
    `;

    return rows;
  }

  async topCustomers() {
    const rows = await this.prisma.$queryRaw<
      Array<{ customer_id: string; full_name: string; total_revenue: string }>
    >`
      SELECT c.id AS customer_id,
             c.full_name AS full_name,
             COALESCE(SUM(i.total_amount), 0)::text AS total_revenue
      FROM customers c
      LEFT JOIN invoices i ON i.customer_id = c.id
      GROUP BY c.id, c.full_name
      ORDER BY COALESCE(SUM(i.total_amount), 0) DESC
      LIMIT 20
    `;

    return rows;
  }
}

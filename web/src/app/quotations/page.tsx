'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Badge, Button, Card, DataTable, ErrorBox, PageHeader, type Column } from '@/components/ui';
import { apiFetch, ApiError } from '@/lib/api';
import { useProtected } from '@/lib/use-protected';

type Quotation = {
  id: string;
  quotationNumber: string;
  status: string;
  rentalStartDate: string;
  rentalEndDate: string;
  totalAmount: string;
  customer: { fullName: string; companyName?: string | null };
};

const statusVariant: Record<string, 'success' | 'danger' | 'warning' | 'primary' | 'default'> = {
  ACCEPTED: 'success',
  REJECTED: 'danger',
  EXPIRED: 'warning',
  SENT: 'primary',
  DRAFT: 'default',
};

export default function QuotationsPage() {
  const { token, clear } = useProtected();
  const router = useRouter();
  const [rows, setRows] = useState<Quotation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);

    apiFetch<Quotation[]>('/quotations', { token })
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((e) => {
        const err = e as ApiError;
        if (err.status === 401) {
          clear();
          return;
        }
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, clear]);

  const totalValue = rows.reduce((s, r) => s + parseFloat(r.totalAmount || '0'), 0);

  const columns: Column<Quotation>[] = [
    {
      key: 'number',
      header: 'Quotation',
      render: (row) => (
        <Link href={`/quotations/${row.id}`} className="font-semibold text-primary hover:underline">
          {row.quotationNumber}
        </Link>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => (
        <div>
          <div className="font-medium text-foreground">{row.customer.fullName}</div>
          {row.customer.companyName && (
            <div className="text-xs text-muted-foreground">{row.customer.companyName}</div>
          )}
        </div>
      ),
    },
    {
      key: 'period',
      header: 'Rental Period',
      render: (row) => (
        <span className="text-muted-foreground text-xs">
          {new Date(row.rentalStartDate).toLocaleDateString()} → {new Date(row.rentalEndDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={statusVariant[row.status] ?? 'default'} dot>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'total',
      header: 'Amount',
      align: 'right',
      render: (row) => (
        <span className="font-semibold tabular-nums text-foreground">
          LKR {parseFloat(row.totalAmount).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Quotations"
          description="Create quotations and convert them to invoices."
        >
          <Link href="/quotations/new">
            <Button>Create Quotation</Button>
          </Link>
        </PageHeader>

        <ErrorBox message={error} />

        {/* Summary row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <Card className="border-l-4 border-l-primary">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Quotations</div>
            <div className="mt-1 text-xl font-bold tabular-nums">{rows.length}</div>
          </Card>
          <Card className="border-l-4 border-l-success">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Value</div>
            <div className="mt-1 text-xl font-bold tabular-nums text-success">LKR {totalValue.toLocaleString()}</div>
          </Card>
          <Card className="border-l-4 border-l-warning">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending</div>
            <div className="mt-1 text-xl font-bold tabular-nums text-warning">
              {rows.filter((r) => r.status === 'DRAFT' || r.status === 'SENT').length}
            </div>
          </Card>
        </div>

        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          onRowClick={(row) => router.push(`/quotations/${row.id}`)}
          emptyMessage="No quotations yet. Get started by creating a new quotation."
        />
      </div>
    </AppShell>
  );
}

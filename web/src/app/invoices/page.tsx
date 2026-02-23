'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Badge, Card, DataTable, EmptyState, ErrorBox, PageHeader, Skeleton, type Column } from '@/components/ui';
import { apiFetch, ApiError } from '@/lib/api';
import { useProtected } from '@/lib/use-protected';

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  invoiceDate: string;
  totalAmount: string;
  balanceDue: string;
  customer: { fullName: string; companyName?: string | null };
};

const statusVariant: Record<string, 'success' | 'danger' | 'warning' | 'primary' | 'default'> = {
  PAID: 'success',
  OVERDUE: 'danger',
  PARTIAL: 'warning',
  SENT: 'primary',
  DRAFT: 'default',
  CANCELLED: 'default',
};

export default function InvoicesPage() {
  const { token, clear } = useProtected();
  const router = useRouter();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);

    apiFetch<Invoice[]>('/invoices', { token })
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

  // Summary stats
  const totalAmount = rows.reduce((s, r) => s + parseFloat(r.totalAmount || '0'), 0);
  const totalBalance = rows.reduce((s, r) => s + parseFloat(r.balanceDue || '0'), 0);
  const paidCount = rows.filter((r) => r.status === 'PAID').length;
  const overdueCount = rows.filter((r) => r.status === 'OVERDUE').length;

  const columns: Column<Invoice>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice',
      render: (row) => (
        <Link href={`/invoices/${row.id}`} className="font-semibold text-primary hover:underline">
          {row.invoiceNumber}
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
      key: 'date',
      header: 'Date',
      render: (row) => (
        <span className="text-muted-foreground">
          {new Date(row.invoiceDate).toLocaleDateString()}
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
      header: 'Total',
      align: 'right',
      render: (row) => (
        <span className="font-semibold tabular-nums text-foreground">
          LKR {parseFloat(row.totalAmount).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'balance',
      header: 'Balance Due',
      align: 'right',
      render: (row) => {
        const bal = parseFloat(row.balanceDue);
        return (
          <span className={'font-semibold tabular-nums ' + (bal > 0 ? 'text-danger' : 'text-success')}>
            LKR {bal.toLocaleString()}
          </span>
        );
      },
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Invoices"
          description="Generate PDFs, send to customers, and record payments."
        />

        <ErrorBox message={error} />

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="border-l-4 border-l-primary">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Invoices</div>
            <div className="mt-1 text-xl font-bold tabular-nums">{rows.length}</div>
          </Card>
          <Card className="border-l-4 border-l-success">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Amount</div>
            <div className="mt-1 text-xl font-bold tabular-nums text-success">LKR {totalAmount.toLocaleString()}</div>
          </Card>
          <Card className="border-l-4 border-l-danger">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outstanding</div>
            <div className="mt-1 text-xl font-bold tabular-nums text-danger">LKR {totalBalance.toLocaleString()}</div>
          </Card>
          <Card className="border-l-4 border-l-warning">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overdue</div>
            <div className="mt-1 text-xl font-bold tabular-nums text-warning">{overdueCount}</div>
          </Card>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          onRowClick={(row) => router.push(`/invoices/${row.id}`)}
          emptyMessage="No invoices yet. Invoices are generated from quotations."
        />
      </div>
    </AppShell>
  );
}

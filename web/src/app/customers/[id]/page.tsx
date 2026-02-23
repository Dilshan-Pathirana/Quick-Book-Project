'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Avatar, Badge, Button, Card, DataTable, ErrorBox, Money, PageHeader, StatCard, type Column } from '@/components/ui';
import { apiFetch, ApiError } from '@/lib/api';
import { useProtected } from '@/lib/use-protected';

type Customer = {
  id: string;
  customerType: 'INDIVIDUAL' | 'COMPANY';
  fullName: string;
  companyName?: string | null;
  nicOrBr?: string | null;
  phone?: string | null;
  whatsappNumber?: string | null;
  email?: string | null;
  address?: string | null;
  creditLimit?: string | null;
  notes?: string | null;
};

type Transactions = {
  customer: Customer;
  invoices: Array<{ id: string; invoiceNumber: string; totalAmount: string; balanceDue: string; invoiceDate: string }>;
  totals: { totalRevenue: string; totalOutstanding: string };
};

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { token, clear } = useProtected();

  const [data, setData] = useState<Transactions | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setError(null);

    apiFetch<Transactions>(`/customers/${id}/transactions`, { token })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        const err = e as ApiError;
        if (err.status === 401) {
          clear();
          router.push('/login');
          return;
        }
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [token, id, clear, router]);

  async function onDelete() {
    if (!token) return;
    if (!confirm('Delete this customer?')) return;

    try {
      await apiFetch(`/customers/${id}`, { method: 'DELETE', token });
      router.push('/customers');
    } catch (e) {
      const err = e as ApiError;
      setError(err.message);
    }
  }

  const c = data?.customer;

  const invoiceColumns: Column<Transactions['invoices'][number]>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (inv) => (
        <Link href={`/invoices/${inv.id}`} className="font-semibold text-primary hover:underline">
          {inv.invoiceNumber}
        </Link>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (inv) => <span className="text-sm tabular-nums">{inv.invoiceDate.slice(0, 10)}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (inv) => <Money amount={inv.totalAmount} />,
    },
    {
      key: 'balance',
      header: 'Balance Due',
      align: 'right',
      render: (inv) => {
        const bal = parseFloat(inv.balanceDue) || 0;
        return <span className={`font-semibold tabular-nums ${bal > 0 ? 'text-danger' : 'text-success'}`}>LKR {inv.balanceDue}</span>;
      },
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Customer" description="Rental history & balances.">
          <div className="flex gap-2">
            <Link href="/quotations/new">
              <Button variant="secondary">New Quotation</Button>
            </Link>
            <Button variant="danger" onClick={onDelete}>Delete</Button>
          </div>
        </PageHeader>

        <ErrorBox message={error} />

        {c ? (
          <Card elevated>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <Avatar name={c.fullName} size="lg" />
                <div>
                  <div className="text-lg font-semibold text-foreground">{c.fullName}</div>
                  <div className="text-sm text-muted-foreground">{c.companyName ?? '—'}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={c.customerType === 'COMPANY' ? 'primary' : 'default'}>{c.customerType}</Badge>
                    {c.phone ? <Badge variant="default">{c.phone}</Badge> : null}
                    {c.whatsappNumber ? <Badge variant="success">WhatsApp {c.whatsappNumber}</Badge> : null}
                    {c.nicOrBr ? <Badge variant="info">NIC/BR {c.nicOrBr}</Badge> : null}
                  </div>
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                {c.email ? <div>{c.email}</div> : null}
                {c.address ? <div className="mt-1 max-w-xs">{c.address}</div> : null}
              </div>
            </div>
          </Card>
        ) : (
          <div className="text-sm text-muted-foreground">Loading…</div>
        )}

        {data ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard title="Total Revenue" value={`LKR ${data.totals.totalRevenue}`} accentColor="success" />
            <StatCard title="Outstanding" value={`LKR ${data.totals.totalOutstanding}`} accentColor="danger" />
            <StatCard title="Invoices" value={String(data.invoices.length)} accentColor="primary" />
          </div>
        ) : null}

        <DataTable
          columns={invoiceColumns}
          data={data?.invoices ?? []}
          loading={!data}
          onRowClick={(inv) => router.push(`/invoices/${inv.id}`)}
          emptyMessage="No invoices yet."
        />
      </div>
    </AppShell>
  );
}

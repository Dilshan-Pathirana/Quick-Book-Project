'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Avatar, Badge, Button, Card, DataTable, ErrorBox, PageHeader, SearchInput, type Column } from '@/components/ui';
import { apiFetch, ApiError } from '@/lib/api';
import { useProtected } from '@/lib/use-protected';

type Customer = {
  id: string;
  customerType: 'INDIVIDUAL' | 'COMPANY';
  fullName: string;
  companyName?: string | null;
  phone?: string | null;
  whatsappNumber?: string | null;
  email?: string | null;
  creditLimit?: string | null;
};

export default function CustomersPage() {
  const { token, clear } = useProtected();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => search.trim(), [search]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = query
      ? `/customers?search=${encodeURIComponent(query)}`
      : '/customers';

    apiFetch<Customer[]>(url, { token })
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
  }, [token, query, clear]);

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Customer',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.fullName} size="sm" />
          <div>
            <Link href={`/customers/${row.id}`} className="font-semibold text-primary hover:underline">
              {row.fullName}
            </Link>
            {row.companyName && (
              <div className="text-xs text-muted-foreground">{row.companyName}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <Badge variant={row.customerType === 'COMPANY' ? 'primary' : 'default'}>
          {row.customerType}
        </Badge>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (row) => (
        <div className="text-sm text-muted-foreground">
          {row.phone && <div>{row.phone}</div>}
          {row.email && <div className="text-xs">{row.email}</div>}
        </div>
      ),
    },
    {
      key: 'creditLimit',
      header: 'Credit Limit',
      align: 'right',
      render: (row) => (
        <span className="font-semibold tabular-nums text-foreground">
          {row.creditLimit ? `LKR ${parseFloat(row.creditLimit).toLocaleString()}` : '—'}
        </span>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Customers"
          description="Manage your individual and company customers."
        >
          <Link href="/customers/new">
            <Button>Add Customer</Button>
          </Link>
        </PageHeader>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search customers..."
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="primary">{rows.length}</Badge>
            <span>customers</span>
          </div>
        </div>

        <ErrorBox message={error} />

        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          onRowClick={(row) => router.push(`/customers/${row.id}`)}
          emptyMessage="No customers found. Get started by creating a new customer."
        />
      </div>
    </AppShell>
  );
}

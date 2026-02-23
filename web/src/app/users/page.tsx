'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Avatar, Badge, DataTable, ErrorBox, PageHeader, SearchInput, type Column } from '@/components/ui';
import { apiFetch, ApiError } from '@/lib/api';
import { useProtected } from '@/lib/use-protected';

type UserRow = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
  role: { name: string };
  createdAt: string;
  updatedAt: string;
};

const roleBadge: Record<string, 'primary' | 'info' | 'warning' | 'default'> = {
  OWNER: 'primary',
  ACCOUNTANT: 'info',
  SALES: 'warning',
  INVENTORY_MANAGER: 'default',
};

export default function UsersPage() {
  const { token, clear } = useProtected();
  const router = useRouter();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => search.trim().toLowerCase(), [search]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch<UserRow[]>('/users', { token })
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

  const filtered = useMemo(() => {
    if (!query) return rows;
    return rows.filter((u) => {
      const hay = `${u.fullName} ${u.email} ${u.phone ?? ''} ${u.role?.name ?? ''}`.toLowerCase();
      return hay.includes(query);
    });
  }, [rows, query]);

  const columns: Column<UserRow>[] = [
    {
      key: 'name',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.fullName} size="sm" />
          <div>
            <Link href={`/users/${u.id}`} className="font-semibold text-primary hover:underline">
              {u.fullName}
            </Link>
            <div className="text-xs text-muted-foreground">{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (
        <Badge variant={roleBadge[u.role?.name] ?? 'default'}>
          {u.role?.name ?? '—'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => (
        <Badge variant={u.isActive ? 'success' : 'danger'} dot>
          {u.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (u) => (
        <span className="text-sm text-muted-foreground">{u.phone ?? '—'}</span>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      align: 'right',
      render: (u) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {new Date(u.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Users"
          description="User profiles and full activity history."
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search users..."
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="primary">{filtered.length}</Badge>
            <span>users</span>
          </div>
        </div>

        <ErrorBox message={error} />

        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          onRowClick={(u) => router.push(`/users/${u.id}`)}
          emptyMessage="No matching users found."
        />
      </div>
    </AppShell>
  );
}

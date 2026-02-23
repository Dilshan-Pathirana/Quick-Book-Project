'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Badge, Button, Card, ErrorBox, PageHeader, Skeleton } from '@/components/ui';
import { apiFetch, ApiError } from '@/lib/api';
import { useProtected } from '@/lib/use-protected';

type Equipment = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  serialNumber: string;
  internalCode: string;
  status: 'AVAILABLE' | 'RESERVED' | 'RENTED' | 'MAINTENANCE';
  dailyRate?: string | null;
  hourlyRate?: string | null;
  category?: { id: string; name: string };
  warehouse?: { id: string; name: string } | null;
};

const statusVariant: Record<string, 'success' | 'primary' | 'warning' | 'danger' | 'default'> = {
  AVAILABLE: 'success',
  RESERVED: 'warning',
  RENTED: 'primary',
  MAINTENANCE: 'danger',
};

export default function EquipmentPage() {
  const { token, clear } = useProtected();
  const [rows, setRows] = useState<Equipment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);

    apiFetch<Equipment[]>('/equipment', { token })
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

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Equipment"
          description="Manage your inventory, availability, and rates."
        >
          <Link href="/equipment/new">
            <Button>Add Equipment</Button>
          </Link>
        </PageHeader>

        <ErrorBox message={error} />

        {/* Status summary */}
        <div className="flex flex-wrap gap-2">
          {['AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE'].map((s) => {
            const count = rows.filter((e) => e.status === s).length;
            return (
              <Badge key={s} variant={statusVariant[s] ?? 'default'} dot>
                {s}: {count}
              </Badge>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)
          ) : null}

          {rows.map((e) => (
            <Card key={e.id} noPadding className="overflow-hidden hover:border-primary/40 transition-colors">
              <Link href={`/equipment/${e.id}`} className="block">
                <div className="aspect-[16/10] w-full bg-muted/40">
                  {e.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={e.imageUrl}
                      alt={e.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">{e.name}</div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {e.category?.name ?? 'Uncategorized'}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge variant={statusVariant[e.status] ?? 'default'}>
                        {e.status}
                      </Badge>
                      {e.isActive === false ? <Badge variant="danger">INACTIVE</Badge> : null}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-border/50 bg-muted/30 p-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Daily</span>
                      <span className="font-semibold text-foreground tabular-nums">
                        {e.dailyRate ? `LKR ${e.dailyRate}` : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Hourly</span>
                      <span className="font-semibold text-foreground tabular-nums">
                        {e.hourlyRate ? `LKR ${e.hourlyRate}` : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">SN: {e.serialNumber}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">{e.internalCode}</span>
                    {e.warehouse?.name ? <span className="rounded bg-primary-light px-1.5 py-0.5 text-primary">{e.warehouse.name}</span> : null}
                  </div>
                </div>
              </Link>
            </Card>
          ))}

          {!loading && rows.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 rounded-xl border border-dashed border-border p-12 text-center">
              <h3 className="text-sm font-semibold text-foreground">No equipment</h3>
              <p className="mt-1 text-sm text-muted-foreground">Get started by adding new equipment to your inventory.</p>
              <div className="mt-4">
                <Link href="/equipment/new">
                  <Button variant="secondary">Add Equipment</Button>
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

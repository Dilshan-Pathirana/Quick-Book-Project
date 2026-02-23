'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Badge, Button, Card, ErrorBox, Input, Label, PageHeader, Skeleton } from '@/components/ui';
import { apiFetch, ApiError } from '@/lib/api';
import { useProtected } from '@/lib/use-protected';

type Rental = {
  id: string;
  status: string;
  rentalStart: string;
  rentalEnd: string;
  actualReturnDate?: string | null;
  conditionOut?: string | null;
  conditionIn?: string | null;
  damageNotes?: string | null;
  invoice: { id: string; invoiceNumber: string };
  equipment: { id: string; name: string; internalCode: string };
};

const statusVariant: Record<string, 'default' | 'primary' | 'success' | 'danger'> = {
  PENDING: 'default',
  OUT: 'primary',
  RETURNED: 'success',
  DAMAGED: 'danger',
};

export default function RentalsPage() {
  const { token, clear } = useProtected();
  const [rows, setRows] = useState<Rental[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [conditionOut, setConditionOut] = useState('');
  const [conditionIn, setConditionIn] = useState('');
  const [damageNotes, setDamageNotes] = useState('');

  async function reload() {
    if (!token) return;
    const data = await apiFetch<Rental[]>('/rentals', { token });
    setRows(data);
  }

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);

    apiFetch<Rental[]>('/rentals', { token })
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

  async function markOut(id: string) {
    if (!token) return;
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/rentals/${id}/mark-out`, {
        method: 'PUT',
        token,
        body: JSON.stringify({ conditionOut: conditionOut || undefined }),
      });
      await reload();
      setConditionOut('');
    } catch (e) {
      const err = e as ApiError;
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function markReturned(id: string) {
    if (!token) return;
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/rentals/${id}/mark-returned`, {
        method: 'PUT',
        token,
        body: JSON.stringify({ conditionIn: conditionIn || undefined }),
      });
      await reload();
      setConditionIn('');
    } catch (e) {
      const err = e as ApiError;
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function reportDamage(id: string) {
    if (!token) return;
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/rentals/${id}/report-damage`, {
        method: 'PUT',
        token,
        body: JSON.stringify({ damageNotes: damageNotes || undefined, conditionIn: conditionIn || undefined }),
      });
      await reload();
      setDamageNotes('');
      setConditionIn('');
    } catch (e) {
      const err = e as ApiError;
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const counts = {
    pending: rows.filter((r) => r.status === 'PENDING').length,
    out: rows.filter((r) => r.status === 'OUT').length,
    returned: rows.filter((r) => r.status === 'RETURNED').length,
    damaged: rows.filter((r) => r.status === 'DAMAGED').length,
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Rentals"
          description="Manage equipment dispatch, returns, and damage reports."
        />

        <ErrorBox message={error} />

        {/* Status summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pending</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-foreground">{counts.pending}</div>
          </Card>
          <Card>
            <div className="text-xs font-medium uppercase tracking-wider text-primary">Out</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-primary">{counts.out}</div>
          </Card>
          <Card>
            <div className="text-xs font-medium uppercase tracking-wider text-success">Returned</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-success">{counts.returned}</div>
          </Card>
          <Card>
            <div className="text-xs font-medium uppercase tracking-wider text-danger">Damaged</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-danger">{counts.damaged}</div>
          </Card>
        </div>

        {/* Quick action context */}
        <Card className="bg-muted/30 border-dashed">
          <div className="mb-4 text-sm font-semibold text-foreground">Quick Actions Context</div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label>Condition out</Label>
              <Input value={conditionOut} onChange={(e) => setConditionOut(e.target.value)} placeholder="e.g. Good condition" className="mt-1.5 bg-card" />
            </div>
            <div>
              <Label>Condition in</Label>
              <Input value={conditionIn} onChange={(e) => setConditionIn(e.target.value)} placeholder="e.g. Scratched" className="mt-1.5 bg-card" />
            </div>
            <div>
              <Label>Damage notes</Label>
              <Input value={damageNotes} onChange={(e) => setDamageNotes(e.target.value)} placeholder="e.g. Broken handle" className="mt-1.5 bg-card" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Fill these fields before clicking the action buttons below.</p>
        </Card>

        {/* Rental cards */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : null}

          {rows.map((r) => (
            <Card key={r.id} elevated className="hover:border-primary/40 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-base font-semibold text-foreground">{r.equipment.name}</span>
                    <Badge variant={statusVariant[r.status] ?? 'default'} dot>
                      {r.status}
                    </Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{r.invoice.invoiceNumber}</span>
                    <span className="tabular-nums">
                      {new Date(r.rentalStart).toLocaleDateString()} → {new Date(r.rentalEnd).toLocaleDateString()}
                    </span>
                    <span className="text-xs">Code: {r.equipment.internalCode}</span>
                  </div>

                  {(r.conditionOut || r.conditionIn || r.damageNotes) && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3 text-sm">
                      {r.conditionOut && (
                        <div>
                          <span className="text-xs text-muted-foreground block">Condition Out</span>
                          <span className="text-foreground">{r.conditionOut}</span>
                        </div>
                      )}
                      {r.conditionIn && (
                        <div>
                          <span className="text-xs text-muted-foreground block">Condition In</span>
                          <span className="text-foreground">{r.conditionIn}</span>
                        </div>
                      )}
                      {r.damageNotes && (
                        <div>
                          <span className="text-xs text-danger block">Damage Notes</span>
                          <span className="text-danger font-medium">{r.damageNotes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap lg:flex-col gap-2 lg:min-w-[130px]">
                  {r.status === 'PENDING' && (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={busyId === r.id}
                      onClick={() => markOut(r.id)}
                      className="w-full"
                    >
                      Dispatch
                    </Button>
                  )}
                  {r.status === 'OUT' && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => markReturned(r.id)}
                        className="w-full"
                      >
                        Return
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => reportDamage(r.id)}
                        className="w-full"
                      >
                        Report Damage
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {!loading && rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <h3 className="text-sm font-semibold text-foreground">No active rentals</h3>
              <p className="mt-1 text-sm text-muted-foreground">Rentals will appear here once an invoice is created.</p>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Avatar, Badge, Button, Card, ErrorBox, Input, Label, PageHeader, Skeleton } from '@/components/ui';
import { apiFetch, ApiError } from '@/lib/api';
import { useProtected } from '@/lib/use-protected';

export default function AnalyticsPage() {
  const { token, clear } = useProtected();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [from, setFrom] = useState('2026-01-01');
  const [to, setTo] = useState('2026-12-31');
  const [revenue, setRevenue] = useState<any>(null);
  const [equipmentPerf, setEquipmentPerf] = useState<any[]>([]);
  const [best, setBest] = useState<any[]>([]);
  const [worst, setWorst] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      apiFetch<any>('/analytics/revenue?from=2026-01-01&to=2026-12-31', { token }),
      apiFetch<any[]>('/analytics/equipment/performance', { token }),
      apiFetch<any[]>('/analytics/equipment/best', { token }),
      apiFetch<any[]>('/analytics/equipment/worst', { token }),
      apiFetch<any[]>('/analytics/customers/top', { token }),
    ])
      .then(([rev, perf, b, w, tc]) => {
        if (cancelled) return;
        setRevenue(rev);
        setEquipmentPerf(perf);
        setBest(b);
        setWorst(w);
        setTopCustomers(tc);
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

  async function loadRevenue() {
    if (!token) return;
    setError(null);
    try {
      const rev = await apiFetch<any>(
        `/analytics/revenue?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        { token },
      );
      setRevenue(rev);
    } catch (e) {
      const err = e as ApiError;
      setError(err.message);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Analytics"
          description="Revenue trends, equipment performance, and top customers."
        />

        <ErrorBox message={error} />

        {/* Revenue Trend */}
        <Card noPadding className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-foreground">Revenue Trend</h2>
            <p className="text-sm text-muted-foreground">Daily revenue over selected period</p>
          </div>

          <div className="px-5 py-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 items-end bg-muted/30 p-4 rounded-lg border border-border/50 mb-5">
              <div>
                <Label>From Date</Label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 bg-card" />
              </div>
              <div>
                <Label>To Date</Label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 bg-card" />
              </div>
              <div>
                <Button type="button" onClick={loadRevenue} className="w-full">
                  Update Chart
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
                </div>
              ) : null}

              {(revenue?.points ?? []).slice(0, 14).map((p: any, i: number) => {
                const maxVal = Math.max(...(revenue?.points ?? []).map((pt: any) => parseFloat(pt.total) || 0), 1);
                const pct = ((parseFloat(p.total) || 0) / maxVal) * 100;
                return (
                  <div key={p.day} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors">
                    <span className="w-28 shrink-0 text-sm text-muted-foreground tabular-nums">
                      {new Date(p.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1 h-6 bg-muted/30 rounded overflow-hidden">
                      <div
                        className="h-full bg-primary/20 rounded transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-32 text-right text-sm font-semibold tabular-nums text-foreground">
                      LKR {parseFloat(p.total).toLocaleString()}
                    </span>
                  </div>
                );
              })}
              {!loading && revenue && (revenue.points?.length ?? 0) === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">No revenue recorded in this date range.</div>
              ) : null}
            </div>
          </div>
        </Card>

        {/* Top / Worst Performers */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card noPadding className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Top Performers</h2>
                <p className="text-xs text-muted-foreground">Highest revenue equipment</p>
              </div>
              <Badge variant="success">{best.length}</Badge>
            </div>
            <div className="px-5 py-3 space-y-2">
              {loading ? <Skeleton className="h-32 rounded-lg" /> : null}
              {best.map((r: any, i: number) => (
                <div key={r.equipment_id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:border-success/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success-light text-xs font-bold text-success">{i + 1}</span>
                    <span className="text-sm font-semibold text-foreground">{r.equipment_name}</span>
                  </div>
                  <span className="text-sm font-semibold text-success tabular-nums">LKR {parseFloat(r.total_revenue).toLocaleString()}</span>
                </div>
              ))}
              {!loading && best.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No data available</div>}
            </div>
          </Card>

          <Card noPadding className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Underperformers</h2>
                <p className="text-xs text-muted-foreground">Lowest revenue equipment</p>
              </div>
              <Badge variant="danger">{worst.length}</Badge>
            </div>
            <div className="px-5 py-3 space-y-2">
              {loading ? <Skeleton className="h-32 rounded-lg" /> : null}
              {worst.map((r: any, i: number) => (
                <div key={r.equipment_id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:border-danger/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-danger-light text-xs font-bold text-danger">{i + 1}</span>
                    <span className="text-sm font-semibold text-foreground">{r.equipment_name}</span>
                  </div>
                  <span className="text-sm font-semibold text-danger tabular-nums">LKR {parseFloat(r.total_revenue).toLocaleString()}</span>
                </div>
              ))}
              {!loading && worst.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No data available</div>}
            </div>
          </Card>
        </div>

        {/* Equipment Performance & Top Customers */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card noPadding className="overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">Equipment Performance</h2>
              <p className="text-xs text-muted-foreground">Revenue vs Maintenance</p>
            </div>
            <div className="px-5 py-3 space-y-2 max-h-[400px] overflow-y-auto">
              {loading ? <Skeleton className="h-32 rounded-lg" /> : null}
              {equipmentPerf.slice(0, 20).map((r: any) => (
                <div key={r.equipment_id} className="rounded-lg border border-border bg-card p-3 hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground">{r.equipment_name}</span>
                    <span className="text-sm font-semibold tabular-nums text-foreground">LKR {parseFloat(r.total_revenue).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 p-2 rounded">
                    <span>Rentals: <span className="font-semibold text-foreground">{r.total_rentals}</span></span>
                    <span>Maint: <span className="font-semibold text-danger">LKR {parseFloat(r.maintenance_cost).toLocaleString()}</span></span>
                  </div>
                </div>
              ))}
              {!loading && equipmentPerf.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No data available</div>}
            </div>
          </Card>

          <Card noPadding className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Top Customers</h2>
                <p className="text-xs text-muted-foreground">By total revenue</p>
              </div>
              <Badge variant="primary">{topCustomers.length}</Badge>
            </div>
            <div className="px-5 py-3 space-y-2">
              {loading ? <Skeleton className="h-32 rounded-lg" /> : null}
              {topCustomers.map((r: any) => (
                <div key={r.customer_id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.full_name} size="sm" />
                    <span className="text-sm font-semibold text-foreground">{r.full_name}</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-foreground">LKR {parseFloat(r.total_revenue).toLocaleString()}</span>
                </div>
              ))}
              {!loading && topCustomers.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No data available</div>}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

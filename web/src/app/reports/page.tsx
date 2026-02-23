'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card, ErrorBox, PageHeader, Skeleton, Badge } from '@/components/ui';
import { apiFetch, ApiError } from '@/lib/api';
import { useProtected } from '@/lib/use-protected';

export default function ReportsPage() {
  const { token, clear } = useProtected();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [pl, setPl] = useState<any>(null);
  const [bs, setBs] = useState<any>(null);
  const [cf, setCf] = useState<any>(null);
  const [vat, setVat] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      apiFetch('/reports/profit-loss', { token }),
      apiFetch('/reports/balance-sheet', { token }),
      apiFetch('/reports/cash-flow', { token }),
      apiFetch('/reports/vat-summary', { token }),
    ])
      .then(([a, b, c, d]) => {
        if (cancelled) return;
        setPl(a);
        setBs(b);
        setCf(c);
        setVat(d);
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

  const fmtNum = (val: any) => {
    if (val == null) return '—';
    const n = parseFloat(String(val));
    return isNaN(n) ? String(val) : `LKR ${n.toLocaleString()}`;
  };

  const netProfit = pl?.netProfit ? parseFloat(String(pl.netProfit)) : null;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Financial Reports"
          description="Profit & loss, balance sheet, cash flow, VAT summary."
        />

        <ErrorBox message={error} />

        {/* Summary KPI row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className={'border-l-4 ' + (netProfit != null && netProfit >= 0 ? 'border-l-success' : 'border-l-danger')}>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Net Profit</div>
            {loading ? (
              <Skeleton className="mt-2 h-7 w-28" />
            ) : (
              <div className={'mt-1 text-xl font-bold tabular-nums ' + (netProfit != null && netProfit >= 0 ? 'text-success' : 'text-danger')}>
                {fmtNum(pl?.netProfit)}
              </div>
            )}
          </Card>
          <Card className="border-l-4 border-l-primary">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Assets</div>
            {loading ? <Skeleton className="mt-2 h-7 w-28" /> : (
              <div className="mt-1 text-xl font-bold tabular-nums text-primary">{fmtNum(bs?.assets)}</div>
            )}
          </Card>
          <Card className="border-l-4 border-l-warning">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cash Flow (Net)</div>
            {loading ? <Skeleton className="mt-2 h-7 w-28" /> : (
              <div className="mt-1 text-xl font-bold tabular-nums">{fmtNum(cf?.cashNet)}</div>
            )}
          </Card>
          <Card className="border-l-4 border-l-danger">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">VAT Payable</div>
            {loading ? <Skeleton className="mt-2 h-7 w-28" /> : (
              <div className="mt-1 text-xl font-bold tabular-nums text-danger">{fmtNum(vat?.vatPayableNet)}</div>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* P&L */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Profit & Loss</h2>
                <p className="text-xs text-muted-foreground">Income statement</p>
              </div>
              {netProfit != null && (
                <Badge variant={netProfit >= 0 ? 'success' : 'danger'}>
                  {netProfit >= 0 ? 'Profit' : 'Loss'}
                </Badge>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-success-light/30 border border-success/10 p-3">
                  <span className="text-sm font-medium text-success">Income</span>
                  <span className="font-bold tabular-nums text-success">{fmtNum(pl?.income)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-danger-light/30 border border-danger/10 p-3">
                  <span className="text-sm font-medium text-danger">Expense</span>
                  <span className="font-bold tabular-nums text-danger">{fmtNum(pl?.expense)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted border border-border p-3">
                  <span className="text-sm font-semibold text-foreground">Net Profit</span>
                  <span className={'font-bold tabular-nums ' + (netProfit != null && netProfit >= 0 ? 'text-success' : 'text-danger')}>
                    {fmtNum(pl?.netProfit)}
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* Balance Sheet */}
          <Card>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-foreground">Balance Sheet</h2>
              <p className="text-xs text-muted-foreground">Financial position</p>
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-primary-light/30 border border-primary/10 p-3">
                  <span className="text-sm font-medium text-primary">Assets</span>
                  <span className="font-bold tabular-nums text-primary">{fmtNum(bs?.assets)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-danger-light/30 border border-danger/10 p-3">
                  <span className="text-sm font-medium text-danger">Liabilities</span>
                  <span className="font-bold tabular-nums text-danger">{fmtNum(bs?.liabilities)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted border border-border p-3">
                  <span className="text-sm font-semibold text-foreground">Equity</span>
                  <span className="font-bold tabular-nums">{fmtNum(bs?.equity)}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Cash Flow */}
          <Card>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-foreground">Cash Flow</h2>
              <p className="text-xs text-muted-foreground">Cash movement summary</p>
            </div>

            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="flex items-center justify-center rounded-lg bg-muted p-6">
                <div className="text-center">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Net Cash Position</div>
                  <div className="text-3xl font-bold tabular-nums text-foreground">{fmtNum(cf?.cashNet)}</div>
                </div>
              </div>
            )}
          </Card>

          {/* VAT Summary */}
          <Card>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-foreground">VAT Summary</h2>
              <p className="text-xs text-muted-foreground">Tax obligations</p>
            </div>

            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="flex items-center justify-center rounded-lg bg-warning-light/30 border border-warning/10 p-6">
                <div className="text-center">
                  <div className="text-xs font-semibold uppercase tracking-wider text-warning mb-2">VAT Payable (Net)</div>
                  <div className="text-3xl font-bold tabular-nums text-warning">{fmtNum(vat?.vatPayableNet)}</div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

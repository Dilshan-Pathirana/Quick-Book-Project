'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuthToken } from '@/lib/auth';
import { AppShell } from '@/components/app-shell';
import { Card, CardTitle, CardValue, ErrorBox, StatCard, Badge, Skeleton, PageHeader } from '@/components/ui';

type DashboardData = {
  monthFrom: string;
  totalRevenue: string;
  outstandingReceivables: string;
  invoiceCounts: Array<{ status: string; _count: { status: number } }>;
};

const statusVariantMap: Record<string, 'success' | 'danger' | 'warning' | 'primary' | 'default'> = {
  PAID: 'success',
  OVERDUE: 'danger',
  PARTIAL: 'warning',
  SENT: 'primary',
  DRAFT: 'default',
  CANCELLED: 'default',
};

export default function DashboardPage() {
  const router = useRouter();
  const { token, clear } = useAuthToken();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token === null) return;
    if (!token) {
      router.push('/login');
      return;
    }

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await apiFetch<DashboardData>('/analytics/dashboard', { token });
        if (!cancelled) setData(res);
      } catch (e) {
        const err = e as ApiError;
        if (err.status === 401) {
          clear();
          router.push('/login');
          return;
        }
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, clear, router]);

  const totalInvoices = (data?.invoiceCounts ?? []).reduce((s, r) => s + r._count.status, 0);
  const paidCount = data?.invoiceCounts.find((r) => r.status === 'PAID')?._count.status ?? 0;
  const overdueCount = data?.invoiceCounts.find((r) => r.status === 'OVERDUE')?._count.status ?? 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Business Overview"
          description="Monthly revenue, receivables, and invoice analytics."
        />

        <ErrorBox message={error} />

        {/* KPI Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} elevated>
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-8 w-32" />
                </Card>
              ))}
            </>
          ) : (
            <>
              <StatCard
                title="Monthly Revenue"
                value={`LKR ${data?.totalRevenue ?? '0'}`}
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                accentColor="success"
              />
              <StatCard
                title="Outstanding"
                value={`LKR ${data?.outstandingReceivables ?? '0'}`}
                subtitle="Unpaid receivables"
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                accentColor="warning"
              />
              <StatCard
                title="Total Invoices"
                value={String(totalInvoices)}
                subtitle={`${paidCount} paid`}
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                  </svg>
                }
                accentColor="primary"
              />
              <StatCard
                title="Overdue"
                value={String(overdueCount)}
                subtitle="Need attention"
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                }
                accentColor="danger"
              />
            </>
          )}
        </div>

        {/* Invoice status breakdown */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Invoice Status</h2>
                <p className="text-sm text-muted-foreground">Distribution by payment status</p>
              </div>
              <Badge variant="primary">{totalInvoices} total</Badge>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {(data?.invoiceCounts ?? []).map((row) => {
                  const pct = totalInvoices > 0 ? (row._count.status / totalInvoices) * 100 : 0;
                  const variant = statusVariantMap[row.status] ?? 'default';
                  const barColor = {
                    success: 'bg-success',
                    danger: 'bg-danger',
                    warning: 'bg-warning',
                    primary: 'bg-primary',
                    default: 'bg-muted-foreground',
                  }[variant];
                  return (
                    <div key={row.status} className="rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={variant} dot>
                            {row.status}
                          </Badge>
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {row._count.status}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {data && data.invoiceCounts.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No invoices yet. Create quotations to generate invoices.
                  </div>
                ) : null}
              </div>
            )}
          </Card>

          {/* Quick stats side panel */}
          <Card>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-foreground">Quick Summary</h2>
              <p className="text-sm text-muted-foreground">Key financial metrics</p>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4 bg-success-light/30">
                <div className="text-xs font-semibold uppercase tracking-wider text-success">Revenue</div>
                <div className="mt-1 text-xl font-bold tabular-nums text-success">
                  LKR {data?.totalRevenue ?? '—'}
                </div>
              </div>
              <div className="rounded-lg border border-border p-4 bg-warning-light/30">
                <div className="text-xs font-semibold uppercase tracking-wider text-warning">Receivables</div>
                <div className="mt-1 text-xl font-bold tabular-nums text-warning">
                  LKR {data?.outstandingReceivables ?? '—'}
                </div>
              </div>
              <div className="rounded-lg border border-border p-4 bg-primary-light/30">
                <div className="text-xs font-semibold uppercase tracking-wider text-primary">Collection Rate</div>
                <div className="mt-1 text-xl font-bold tabular-nums text-primary">
                  {data && parseFloat(data.totalRevenue) > 0
                    ? `${Math.round(
                        ((parseFloat(data.totalRevenue) - parseFloat(data.outstandingReceivables)) /
                          parseFloat(data.totalRevenue)) *
                          100,
                      )}%`
                    : '—'}
                </div>
              </div>
              <div className="rounded-lg border border-border p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Period</div>
                <div className="mt-1 text-sm font-medium text-foreground">
                  {data?.monthFrom
                    ? new Date(data.monthFrom).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                      })
                    : '—'}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

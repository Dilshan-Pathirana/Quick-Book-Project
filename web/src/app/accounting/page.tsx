'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Badge, Button, Card, ErrorBox, Input, Label, PageHeader, Select, Skeleton } from '@/components/ui';
import { apiFetch, ApiError } from '@/lib/api';
import { useProtected } from '@/lib/use-protected';

type Account = {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
};

type JournalEntry = {
  id: string;
  entryNumber: string;
  referenceType: string;
  referenceId: string;
  entryDate: string;
  description?: string | null;
};

const typeBadge: Record<string, 'primary' | 'success' | 'danger' | 'info' | 'warning' | 'default'> = {
  ASSET: 'info',
  INCOME: 'success',
  LIABILITY: 'danger',
  EXPENSE: 'warning',
  EQUITY: 'primary',
};

export default function AccountingPage() {
  const { token, clear } = useProtected();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [accCode, setAccCode] = useState('');
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'>('ASSET');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      apiFetch<Account[]>('/accounts', { token }),
      apiFetch<JournalEntry[]>('/journal-entries', { token }),
    ])
      .then(([a, j]) => {
        if (cancelled) return;
        setAccounts(a);
        setEntries(j);
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

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);

    try {
      await apiFetch('/accounts', {
        method: 'POST',
        token,
        body: JSON.stringify({ accountCode: accCode, accountName: accName, accountType: accType }),
      });
      const updated = await apiFetch<Account[]>('/accounts', { token });
      setAccounts(updated);
      setAccCode('');
      setAccName('');
    } catch (e) {
      const err = e as ApiError;
      setError(err.message);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Accounting"
          description="Manage chart of accounts and view journal entries."
        />

        <ErrorBox message={error} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Chart of Accounts */}
          <Card noPadding className="flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">Chart of Accounts</h2>
              <Badge variant="primary">{accounts.length}</Badge>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 max-h-[400px]">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
                </div>
              ) : null}

              {accounts.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">{a.accountCode}</span>
                    <span className="text-sm font-semibold text-foreground">{a.accountName}</span>
                  </div>
                  <Badge variant={typeBadge[a.accountType] ?? 'default'}>
                    {a.accountType}
                  </Badge>
                </div>
              ))}
              {!loading && accounts.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">No accounts found.</div>
              ) : null}
            </div>

            <div className="border-t border-border px-5 py-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Add New Account</h3>
              <form className="grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={createAccount}>
                <div>
                  <Label>Account Code</Label>
                  <Input value={accCode} onChange={(e) => setAccCode(e.target.value)} required placeholder="e.g. 1000" className="mt-1" />
                </div>
                <div>
                  <Label>Account Type</Label>
                  <Select value={accType} onChange={(e) => setAccType(e.target.value as any)} className="mt-1">
                    <option value="ASSET">Asset</option>
                    <option value="LIABILITY">Liability</option>
                    <option value="EQUITY">Equity</option>
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Account Name</Label>
                  <Input value={accName} onChange={(e) => setAccName(e.target.value)} required placeholder="e.g. Cash in Bank" className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" className="w-full">Create Account</Button>
                </div>
              </form>
            </div>
          </Card>

          {/* Journal Entries */}
          <Card noPadding className="flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">Recent Journal Entries</h2>
              <Badge variant="default">Latest {Math.min(entries.length, 10)}</Badge>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 max-h-[700px]">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
                </div>
              ) : null}

              {entries.slice(0, 10).map((j) => (
                <div key={j.id} className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-semibold text-foreground">{j.entryNumber}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {new Date(j.entryDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Badge variant="default">{j.referenceType}</Badge>
                    <span className="font-mono truncate">{j.referenceId}</span>
                  </div>
                  {j.description && (
                    <div className="text-sm text-foreground bg-muted/50 p-2 rounded-lg">
                      {j.description}
                    </div>
                  )}
                </div>
              ))}
              {!loading && entries.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  No journal entries recorded yet.
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

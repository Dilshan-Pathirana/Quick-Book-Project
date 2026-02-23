'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Badge, Button, Card, ErrorBox, Input, Label, PageHeader, Select } from '@/components/ui';
import { apiFetch, ApiError } from '@/lib/api';
import { useProtected } from '@/lib/use-protected';

type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
  role: { name: string; description?: string | null };
  createdAt: string;
  updatedAt: string;
};

type RoleRow = { id: string; name: string; description?: string | null };

type ActivityRow = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  timestamp: string;
};

type CreatedQuotation = {
  id: string;
  quotationNumber: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  customer: { id: string; fullName: string };
};

type CreatedInvoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: string;
  balanceDue: string;
  createdAt: string;
  customer: { id: string; fullName: string };
};

type CreatedPayment = {
  id: string;
  paymentDate: string;
  paymentMethod: string;
  amount: string;
  createdAt: string;
  invoice: { id: string; invoiceNumber: string };
};

type CreatedMaintenanceLog = {
  id: string;
  maintenanceDate: string;
  cost: string;
  createdAt: string;
  equipment: { id: string; name: string };
};

type CreatedJournalEntry = {
  id: string;
  entryNumber: string;
  referenceType?: string | null;
  referenceId?: string | null;
  entryDate: string;
  createdAt: string;
};

type UserHistory = {
  user: UserProfile;
  activity: ActivityRow[];
  created: {
    quotations: CreatedQuotation[];
    invoices: CreatedInvoice[];
    payments: CreatedPayment[];
    maintenanceLogs: CreatedMaintenanceLog[];
    journalEntries: CreatedJournalEntry[];
  };
};

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { token, clear } = useProtected();

  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [data, setData] = useState<UserHistory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [roleName, setRoleName] = useState('SALES');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setError(null);

    Promise.all([
      apiFetch<UserHistory>(`/users/${id}/history`, { token }),
      apiFetch<RoleRow[]>('/roles', { token }),
    ])
      .then(([h, r]) => {
        if (cancelled) return;
        setData(h);
        setRoles(r);

        setFullName(h.user.fullName);
        setEmail(h.user.email);
        setPhone(h.user.phone ?? '');
        setIsActive(h.user.isActive);
        setRoleName(h.user.role?.name ?? 'SALES');
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

  const createdSummary = useMemo(() => {
    const created = data?.created;
    return {
      quotations: created?.quotations?.length ?? 0,
      invoices: created?.invoices?.length ?? 0,
      payments: created?.payments?.length ?? 0,
      maintenanceLogs: created?.maintenanceLogs?.length ?? 0,
      journalEntries: created?.journalEntries?.length ?? 0,
    };
  }, [data]);

  async function save() {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/users/${id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({
          fullName,
          email,
          phone: phone || undefined,
          isActive,
          roleName,
          password: password || undefined,
        }),
      });

      const refreshed = await apiFetch<UserHistory>(`/users/${id}/history`, { token });
      setData(refreshed);
      setPassword('');
    } catch (e) {
      const err = e as ApiError;
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!token) return;
    if (!confirm('Delete this user?')) return;

    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE', token });
      router.push('/users');
    } catch (e) {
      const err = e as ApiError;
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="User" description="Profile and complete history.">
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.push('/users')}>
              Back
            </Button>
            <Button variant="danger" onClick={onDelete} disabled={saving}>
              Delete
            </Button>
          </div>
        </PageHeader>

        <ErrorBox message={error} />

        {data ? (
          <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold text-foreground">Profile</div>
                    <div className="mt-1 text-sm text-muted-foreground">Edit user details (OWNER only).</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="primary">{data.user.role?.name ?? '—'}</Badge>
                    <Badge variant={data.user.isActive ? 'success' : 'danger'}>{data.user.isActive ? 'ACTIVE' : 'INACTIVE'}</Badge>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Full name</Label>
                    <Input className="mt-2" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input className="mt-2" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input className="mt-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select className="mt-2" value={roleName} onChange={(e) => setRoleName(e.target.value)}>
                      {roles.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="sm:col-span-2">
                    <Label>New password (optional)</Label>
                    <Input
                      className="mt-2"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank to keep current password"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4">
                    <div>
                      <div className="text-sm font-medium text-foreground">Active user</div>
                      <div className="mt-1 text-xs text-muted-foreground">Inactive users cannot log in.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-5 w-5 rounded border-border text-primary"
                    />
                  </div>

                  <div className="sm:col-span-2 flex gap-3">
                    <Button onClick={save} disabled={saving}>
                      {saving ? 'Saving...' : 'Save changes'}
                    </Button>
                    <Button variant="secondary" onClick={() => {
                      setFullName(data.user.fullName);
                      setEmail(data.user.email);
                      setPhone(data.user.phone ?? '');
                      setIsActive(data.user.isActive);
                      setRoleName(data.user.role?.name ?? 'SALES');
                      setPassword('');
                    }} disabled={saving}>
                      Reset
                    </Button>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="text-lg font-semibold text-foreground">Summary</div>
                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between"><span>Quotations</span><span className="font-semibold text-foreground">{createdSummary.quotations}</span></div>
                  <div className="flex items-center justify-between"><span>Invoices</span><span className="font-semibold text-foreground">{createdSummary.invoices}</span></div>
                  <div className="flex items-center justify-between"><span>Payments</span><span className="font-semibold text-foreground">{createdSummary.payments}</span></div>
                  <div className="flex items-center justify-between"><span>Maintenance logs</span><span className="font-semibold text-foreground">{createdSummary.maintenanceLogs}</span></div>
                  <div className="flex items-center justify-between"><span>Journal entries</span><span className="font-semibold text-foreground">{createdSummary.journalEntries}</span></div>
                </div>
              </Card>
            </div>

            <Card>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-foreground">History</div>
                  <div className="mt-1 text-sm text-muted-foreground">Recent activity logs.</div>
                </div>
                <Badge variant="primary">{data.activity.length} events</Badge>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2">
                {data.activity.map((a) => (
                  <div key={a.id} className="rounded-xl border border-border bg-background p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-foreground">
                        {a.action} {a.entityType}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(a.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Entity ID: <span className="font-mono">{a.entityId}</span>
                    </div>
                  </div>
                ))}

                {data.activity.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-10 text-center">
                    <div className="text-sm font-semibold text-foreground">No history yet</div>
                    <div className="mt-1 text-sm text-muted-foreground">Activity logs will appear here as actions are performed.</div>
                  </div>
                ) : null}
              </div>
            </Card>

            <Card>
              <div>
                <div className="text-lg font-semibold text-foreground">Created records</div>
                <div className="mt-1 text-sm text-muted-foreground">Latest records created/recorded by this user.</div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-foreground">Quotations</div>
                    <Badge variant="primary">{data.created.quotations.length}</Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    {data.created.quotations.map((q) => (
                      <div key={q.id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <Link href={`/quotations/${q.id}`} className="truncate font-medium text-foreground hover:text-primary">
                            {q.quotationNumber}
                          </Link>
                          <div className="truncate text-xs text-muted-foreground">{q.customer?.fullName ?? '—'}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-xs text-muted-foreground">{q.status}</div>
                          <div className="text-xs font-semibold text-foreground">LKR {q.totalAmount}</div>
                        </div>
                      </div>
                    ))}
                    {data.created.quotations.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No quotations.</div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-foreground">Invoices</div>
                    <Badge variant="primary">{data.created.invoices.length}</Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    {data.created.invoices.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <Link href={`/invoices/${inv.id}`} className="truncate font-medium text-foreground hover:text-primary">
                            {inv.invoiceNumber}
                          </Link>
                          <div className="truncate text-xs text-muted-foreground">{inv.customer?.fullName ?? '—'}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-xs text-muted-foreground">{inv.status}</div>
                          <div className="text-xs font-semibold text-foreground">LKR {inv.totalAmount}</div>
                        </div>
                      </div>
                    ))}
                    {data.created.invoices.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No invoices.</div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-foreground">Payments</div>
                    <Badge variant="primary">{data.created.payments.length}</Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    {data.created.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">{p.paymentMethod}</div>
                          <div className="truncate text-xs text-muted-foreground">Invoice {p.invoice?.invoiceNumber ?? '—'}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-xs text-muted-foreground">{new Date(p.paymentDate).toLocaleDateString()}</div>
                          <div className="text-xs font-semibold text-foreground">LKR {p.amount}</div>
                        </div>
                      </div>
                    ))}
                    {data.created.payments.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No payments.</div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-foreground">Maintenance logs</div>
                    <Badge variant="primary">{data.created.maintenanceLogs.length}</Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    {data.created.maintenanceLogs.map((m) => (
                      <div key={m.id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <Link href={`/equipment/${m.equipment.id}`} className="truncate font-medium text-foreground hover:text-primary">
                            {m.equipment.name}
                          </Link>
                          <div className="truncate text-xs text-muted-foreground">{new Date(m.maintenanceDate).toLocaleDateString()}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-xs text-muted-foreground">Cost</div>
                          <div className="text-xs font-semibold text-foreground">LKR {m.cost}</div>
                        </div>
                      </div>
                    ))}
                    {data.created.maintenanceLogs.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No maintenance logs.</div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-4 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-foreground">Journal entries</div>
                    <Badge variant="primary">{data.created.journalEntries.length}</Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    {data.created.journalEntries.map((j) => (
                      <div key={j.id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">{j.entryNumber}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {j.referenceType ? `${j.referenceType} ${j.referenceId ?? ''}` : '—'}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-xs text-muted-foreground">{new Date(j.entryDate).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                    {data.created.journalEntries.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No journal entries.</div>
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">Loading...</div>
        )}
      </div>
    </AppShell>
  );
}

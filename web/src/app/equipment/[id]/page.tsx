'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Badge, Button, Card, ErrorBox, Input, Label, PageHeader, Select, Textarea } from '@/components/ui';
import { apiFetch, ApiError } from '@/lib/api';
import { useMe } from '@/lib/me';
import { useProtected } from '@/lib/use-protected';

type Equipment = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  serialNumber: string;
  internalCode: string;
  status: string;
  dailyRate?: string | null;
  hourlyRate?: string | null;
  conditionNotes?: string | null;
  locationLabel?: string | null;
  category?: { name: string };
  warehouse?: { name: string } | null;
};

type RentalHistoryRow = {
  id: string;
  status: string;
  rentalStart: string;
  rentalEnd: string;
  returnedOn?: string | null;
  conditionOut?: string | null;
  conditionIn?: string | null;
  specialRemarks?: string | null;
  invoice:
    | null
    | {
        id: string;
        invoiceNumber: string;
        invoiceDate: string;
        paidCost?: string;
        customer: {
          id: string;
          fullName: string;
          companyName?: string | null;
          phone?: string | null;
          whatsappNumber?: string | null;
          email?: string | null;
        };
      };
};

type RentalHistoryResponse = {
  equipment: Equipment;
  rentals: RentalHistoryRow[];
};

type MaintenanceLog = {
  id: string;
  maintenanceDate: string;
  description?: string | null;
  cost?: string | null;
  downtimeStart?: string | null;
  downtimeEnd?: string | null;
};

export default function EquipmentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { token, clear } = useProtected();
  const { me } = useMe(token);
  const canEdit = me?.role?.name === 'OWNER' || me?.role?.name === 'INVENTORY_MANAGER';

  const [item, setItem] = useState<Equipment | null>(null);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [rentals, setRentals] = useState<RentalHistoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [availability, setAvailability] = useState<any>(null);

  const [maintDate, setMaintDate] = useState('');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintCost, setMaintCost] = useState('');
  const [maintDownStart, setMaintDownStart] = useState('');
  const [maintDownEnd, setMaintDownEnd] = useState('');

  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [status, setStatus] = useState<'AVAILABLE' | 'RESERVED' | 'RENTED' | 'MAINTENANCE'>('AVAILABLE');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    Promise.all([
      apiFetch<RentalHistoryResponse>(`/equipment/${id}/rental-history`, { token }),
      apiFetch<MaintenanceLog[]>(`/equipment/${id}/maintenance`, { token }),
    ])
      .then(([h, l]) => {
        if (cancelled) return;
        setItem(h.equipment);
        setLogs(l);
        setRentals(h.rentals);

        setImageUrl(h.equipment.imageUrl ?? '');
        setDescription(h.equipment.description ?? '');
        setDailyRate(h.equipment.dailyRate ? String(h.equipment.dailyRate) : '');
        setHourlyRate(h.equipment.hourlyRate ? String(h.equipment.hourlyRate) : '');
        setConditionNotes(h.equipment.conditionNotes ?? '');
        setStatus((h.equipment.status as any) ?? 'AVAILABLE');
        setIsActive(h.equipment.isActive !== false);
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

  async function saveProfile() {
    if (!token || !item) return;
    if (!canEdit) return;

    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/equipment/${id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({
          imageUrl: imageUrl.trim() || undefined,
          description: description.trim() || undefined,
          dailyRate: dailyRate.trim() || undefined,
          hourlyRate: hourlyRate.trim() || undefined,
          conditionNotes: conditionNotes.trim() || undefined,
          status,
          isActive,
        }),
      });

      const refreshed = await apiFetch<RentalHistoryResponse>(`/equipment/${id}/rental-history`, { token });
      setItem(refreshed.equipment);
      setRentals(refreshed.rentals);

      setImageUrl(refreshed.equipment.imageUrl ?? '');
      setDescription(refreshed.equipment.description ?? '');
      setDailyRate(refreshed.equipment.dailyRate ? String(refreshed.equipment.dailyRate) : '');
      setHourlyRate(refreshed.equipment.hourlyRate ? String(refreshed.equipment.hourlyRate) : '');
      setConditionNotes(refreshed.equipment.conditionNotes ?? '');
      setStatus((refreshed.equipment.status as any) ?? 'AVAILABLE');
      setIsActive(refreshed.equipment.isActive !== false);
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 401) {
        clear();
        router.push('/login');
        return;
      }
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function checkAvailability() {
    if (!token) return;
    setError(null);
    setAvailability(null);
    try {
      const res = await apiFetch(`/equipment/${id}/availability?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, { token });
      setAvailability(res);
    } catch (e) {
      const err = e as ApiError;
      setError(err.message);
    }
  }

  async function addMaintenance(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);

    try {
      await apiFetch(`/equipment/${id}/maintenance`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          maintenanceDate: maintDate,
          description: maintDesc || undefined,
          cost: maintCost || undefined,
          downtimeStart: maintDownStart || undefined,
          downtimeEnd: maintDownEnd || undefined,
        }),
      });

      const updated = await apiFetch<MaintenanceLog[]>(`/equipment/${id}/maintenance`, { token });
      setLogs(updated);
      setMaintDate('');
      setMaintDesc('');
      setMaintCost('');
      setMaintDownStart('');
      setMaintDownEnd('');
    } catch (e) {
      const err = e as ApiError;
      setError(err.message);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Equipment" description="Profile, rental history, availability, and maintenance.">
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.push('/equipment')}>
              Back
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!token) return;
                if (!confirm('Delete this equipment item?')) return;
                setError(null);
                try {
                  await apiFetch(`/equipment/${id}`, { method: 'DELETE', token });
                  router.push('/equipment');
                } catch (e) {
                  const err = e as ApiError;
                  if (err.status === 401) {
                    clear();
                    router.push('/login');
                    return;
                  }
                  setError(err.message);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </PageHeader>

        <ErrorBox message={error} />

        {item ? (
          <Card>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <div className="aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-muted/40">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  ) : item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="primary">{status}</Badge>
                  {isActive ? <Badge variant="success">ACTIVE</Badge> : <Badge variant="danger">INACTIVE</Badge>}
                  {item.warehouse?.name ? <Badge variant="info">📍 {item.warehouse.name}</Badge> : null}
                  {item.locationLabel ? <Badge variant="default">{item.locationLabel}</Badge> : null}
                </div>

                <div className="mt-3 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between gap-4">
                    <span>Daily</span>
                    <span className="font-semibold text-foreground">{dailyRate ? `LKR ${dailyRate}` : '—'}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-4">
                    <span>Hourly</span>
                    <span className="font-semibold text-foreground">{hourlyRate ? `LKR ${hourlyRate}` : '—'}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-foreground">{item.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {item.category?.name ?? '—'} · SN: {item.serialNumber} · Code: {item.internalCode}
                    </div>
                  </div>

                  {canEdit ? (
                    <Button onClick={saveProfile} disabled={saving}>
                      {saving ? 'Saving…' : 'Save profile'}
                    </Button>
                  ) : (
                    <Badge variant="default">View only</Badge>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>Image URL</Label>
                    <Input
                      className="mt-2"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      disabled={!canEdit}
                    />
                  </div>

                  <div>
                    <Label>Status</Label>
                    <Select
                      className="mt-2"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      disabled={!canEdit}
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="RESERVED">Reserved</option>
                      <option value="RENTED">Rented</option>
                      <option value="MAINTENANCE">Maintenance</option>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4">
                    <div>
                      <div className="text-sm font-medium text-foreground">Active</div>
                      <div className="mt-1 text-xs text-muted-foreground">Inactive equipment can be hidden from operations.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      disabled={!canEdit}
                      className="h-5 w-5 rounded border-border text-primary"
                    />
                  </div>

                  <div>
                    <Label>Daily rate (LKR)</Label>
                    <Input
                      className="mt-2"
                      inputMode="decimal"
                      value={dailyRate}
                      onChange={(e) => setDailyRate(e.target.value)}
                      disabled={!canEdit}
                    />
                  </div>
                  <div>
                    <Label>Hourly rate (LKR)</Label>
                    <Input
                      className="mt-2"
                      inputMode="decimal"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      disabled={!canEdit}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      className="mt-2"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={!canEdit}
                      placeholder="Equipment details, usage notes, etc."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label>Condition</Label>
                    <Textarea
                      className="mt-2"
                      value={conditionNotes}
                      onChange={(e) => setConditionNotes(e.target.value)}
                      disabled={!canEdit}
                      placeholder="Condition notes / damage / wear"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <div className="text-sm text-muted-foreground">Loading…</div>
        )}

        <Card>
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-foreground">Rental history</div>
              <div className="mt-1 text-sm text-muted-foreground">Complete rental history for this equipment.</div>
            </div>
            <Badge variant="primary">{rentals.length} rentals</Badge>
          </div>

          <div className="mt-4 space-y-2">
            {rentals.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-background p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-foreground">
                    {r.invoice?.invoiceNumber ? `Invoice ${r.invoice.invoiceNumber}` : 'No invoice'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">{r.status}</Badge>
                    {r.invoice?.paidCost ? <Badge variant="default">LKR {String(r.invoice.paidCost)}</Badge> : null}
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                  <div>
                    <div className="text-xs">Start</div>
                    <div className="font-medium text-foreground">
                      {r.rentalStart ? new Date(r.rentalStart).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs">End</div>
                    <div className="font-medium text-foreground">
                      {r.rentalEnd ? new Date(r.rentalEnd).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs">Returned</div>
                    <div className="font-medium text-foreground">
                      {r.returnedOn ? new Date(r.returnedOn).toLocaleDateString() : '—'}
                    </div>
                  </div>
                </div>

                {r.invoice?.customer ? (
                  <div className="mt-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {r.invoice.customer.companyName || r.invoice.customer.fullName}
                    </span>
                    {r.invoice.customer.phone ? <span> · {r.invoice.customer.phone}</span> : null}
                  </div>
                ) : null}

                {r.specialRemarks ? (
                  <div className="mt-3 text-sm text-muted-foreground">Remarks: {r.specialRemarks}</div>
                ) : null}
              </div>
            ))}

            {rentals.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-10 text-center">
                <div className="text-sm font-semibold text-foreground">No rentals yet</div>
                <div className="mt-1 text-sm text-muted-foreground">This equipment has no rental history.</div>
              </div>
            ) : null}
          </div>
        </Card>

        <Card>
          <div className="text-sm font-semibold text-foreground">Availability check</div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <Label>Start (YYYY-MM-DD)</Label>
              <div className="mt-1">
                <Input value={start} onChange={(e) => setStart(e.target.value)} placeholder="2026-02-01" />
              </div>
            </div>
            <div>
              <Label>End (YYYY-MM-DD)</Label>
              <div className="mt-1">
                <Input value={end} onChange={(e) => setEnd(e.target.value)} placeholder="2026-02-03" />
              </div>
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={checkAvailability} className="w-full">
                Check
              </Button>
            </div>
          </div>
          {availability ? (
            <div className="mt-3 text-sm text-muted-foreground">
              <div>
                Available: <span className="font-semibold">{String(availability.available)}</span>
              </div>
              {(availability.conflicts?.rentals?.length ?? 0) > 0 ? (
                <div className="mt-2">Conflicting rentals: {availability.conflicts.rentals.length}</div>
              ) : null}
              {(availability.conflicts?.maintenance?.length ?? 0) > 0 ? (
                <div className="mt-1">Conflicting maintenance: {availability.conflicts.maintenance.length}</div>
              ) : null}
            </div>
          ) : null}
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <div className="text-sm font-semibold text-foreground">Maintenance logs</div>
            <div className="mt-3 space-y-2 text-sm">
              {logs.map((l) => (
                <div key={l.id} className="rounded-xl border border-border bg-background p-3 text-foreground">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{l.maintenanceDate.slice(0, 10)}</div>
                    <div>Cost: {l.cost ?? '—'}</div>
                  </div>
                  {l.description ? <div className="mt-1">{l.description}</div> : null}
                </div>
              ))}
              {logs.length === 0 ? <div className="text-muted-foreground">No maintenance yet.</div> : null}
            </div>
          </Card>

          <Card>
            <div className="text-sm font-semibold text-foreground">Add maintenance</div>
            <form className="mt-3 space-y-3" onSubmit={addMaintenance}>
              <div>
                <Label>Date</Label>
                <div className="mt-1">
                  <Input value={maintDate} onChange={(e) => setMaintDate(e.target.value)} placeholder="2026-02-23" required />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <div className="mt-1">
                  <Textarea value={maintDesc} onChange={(e) => setMaintDesc(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Cost (LKR)</Label>
                <div className="mt-1">
                  <Input inputMode="decimal" value={maintCost} onChange={(e) => setMaintCost(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Label>Downtime start</Label>
                  <div className="mt-1">
                    <Input value={maintDownStart} onChange={(e) => setMaintDownStart(e.target.value)} placeholder="2026-02-23" />
                  </div>
                </div>
                <div>
                  <Label>Downtime end</Label>
                  <div className="mt-1">
                    <Input value={maintDownEnd} onChange={(e) => setMaintDownEnd(e.target.value)} placeholder="2026-02-24" />
                  </div>
                </div>
              </div>
              <Button type="submit">Add log</Button>
            </form>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

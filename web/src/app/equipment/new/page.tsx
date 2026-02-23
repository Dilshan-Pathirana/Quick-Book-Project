'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Button, Card, ErrorBox, Input, Label, PageHeader, Select, Textarea } from '@/components/ui';
import { apiFetch, ApiError } from '@/lib/api';
import { useProtected } from '@/lib/use-protected';
import { listEquipmentCategories, listWarehouses, EquipmentCategory, Warehouse } from '@/lib/meta';

export default function NewEquipmentPage() {
  const router = useRouter();
  const { token, clear } = useProtected();

  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [internalCode, setInternalCode] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [replacementValue, setReplacementValue] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [status, setStatus] = useState<'AVAILABLE' | 'RESERVED' | 'RENTED' | 'MAINTENANCE'>('AVAILABLE');
  const [depreciationMethod, setDepreciationMethod] = useState<'STRAIGHT_LINE' | 'REDUCING_BALANCE'>('STRAIGHT_LINE');
  const [depreciationRate, setDepreciationRate] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [locationLabel, setLocationLabel] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([listEquipmentCategories(token), listWarehouses(token)])
      .then(([c, w]) => {
        setCategories(c);
        setWarehouses(w);
        if (!categoryId && c.length > 0) setCategoryId(c[0].id);
        if (!warehouseId && w.length > 0) setWarehouseId(w[0].id);
      })
      .catch((e) => {
        const err = e as ApiError;
        if (err.status === 401) {
          clear();
          router.push('/login');
          return;
        }
        setError(err.message);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ id: string }>('/equipment', {
        method: 'POST',
        token,
        body: JSON.stringify({
          categoryId,
          name,
          serialNumber,
          internalCode,
          dailyRate: dailyRate || undefined,
          hourlyRate: hourlyRate || undefined,
          purchaseCost: purchaseCost || undefined,
          replacementValue: replacementValue || undefined,
          warehouseId: warehouseId || undefined,
          status,
          depreciationMethod,
          depreciationRate: depreciationRate || undefined,
          conditionNotes: conditionNotes || undefined,
          locationLabel: locationLabel || undefined,
        }),
      });
      router.push(`/equipment/${res.id}`);
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 401) {
        clear();
        router.push('/login');
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="New Equipment" description="Create an equipment item." />

        <Card elevated>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={submit}>
            <div>
              <Label>Category</Label>
              <div className="mt-1">
                <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <div className="mt-1">
                <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="RENTED">Rented</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </Select>
              </div>
            </div>

            <div>
              <Label>Name</Label>
              <div className="mt-1">
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </div>

            <div>
              <Label>Warehouse</Label>
              <div className="mt-1">
                <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                  <option value="">—</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <Label>Serial number</Label>
              <div className="mt-1">
                <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} required />
              </div>
            </div>

            <div>
              <Label>Internal ID</Label>
              <div className="mt-1">
                <Input value={internalCode} onChange={(e) => setInternalCode(e.target.value)} required />
              </div>
            </div>

            <div>
              <Label>Daily rate (LKR)</Label>
              <div className="mt-1">
                <Input inputMode="decimal" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Hourly rate (LKR)</Label>
              <div className="mt-1">
                <Input inputMode="decimal" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Purchase cost (LKR)</Label>
              <div className="mt-1">
                <Input inputMode="decimal" value={purchaseCost} onChange={(e) => setPurchaseCost(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Replacement value (LKR)</Label>
              <div className="mt-1">
                <Input inputMode="decimal" value={replacementValue} onChange={(e) => setReplacementValue(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Depreciation method</Label>
              <div className="mt-1">
                <Select value={depreciationMethod} onChange={(e) => setDepreciationMethod(e.target.value as any)}>
                  <option value="STRAIGHT_LINE">Straight-line</option>
                  <option value="REDUCING_BALANCE">Reducing balance</option>
                </Select>
              </div>
            </div>

            <div>
              <Label>Depreciation rate</Label>
              <div className="mt-1">
                <Input inputMode="decimal" value={depreciationRate} onChange={(e) => setDepreciationRate(e.target.value)} placeholder="e.g. 0.15" />
              </div>
            </div>

            <div>
              <Label>Location label</Label>
              <div className="mt-1">
                <Input value={locationLabel} onChange={(e) => setLocationLabel(e.target.value)} placeholder="Warehouse A / Warehouse B" />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Condition notes</Label>
              <div className="mt-1">
                <Textarea value={conditionNotes} onChange={(e) => setConditionNotes(e.target.value)} />
              </div>
            </div>

            <div className="md:col-span-2">
              <ErrorBox message={error} />
            </div>

            <div className="md:col-span-2 flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving…' : 'Save equipment'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.push('/equipment')}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}

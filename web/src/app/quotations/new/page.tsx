'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Button, Card, ErrorBox, Input, Label, PageHeader, Select } from '@/components/ui';
import { apiFetch, ApiError } from '@/lib/api';
import { useProtected } from '@/lib/use-protected';

type CustomerLite = { id: string; fullName: string; companyName?: string | null; phone?: string | null };

type EquipmentLite = { id: string; name: string; status: string };

type QuotationItemDraft = {
  equipmentId: string;
  quantity: number;
  manualPrice: string;
  rentalDays: number;
};

export default function NewQuotationPage() {
  const router = useRouter();
  const { token, clear } = useProtected();

  const [customerQuery, setCustomerQuery] = useState('');
  const [customerOptions, setCustomerOptions] = useState<CustomerLite[]>([]);
  const [customerId, setCustomerId] = useState('');

  const [rentalStartDate, setRentalStartDate] = useState('');
  const [rentalEndDate, setRentalEndDate] = useState('');

  const [equipment, setEquipment] = useState<EquipmentLite[]>([]);
  const [items, setItems] = useState<QuotationItemDraft[]>([{ equipmentId: '', quantity: 1, manualPrice: '0', rentalDays: 1 }]);

  const [deliveryFee, setDeliveryFee] = useState('');
  const [operatorFee, setOperatorFee] = useState('');
  const [discount, setDiscount] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customerQ = useMemo(() => customerQuery.trim(), [customerQuery]);

  useEffect(() => {
    if (!token) return;

    apiFetch<EquipmentLite[]>('/equipment', { token })
      .then((data) => setEquipment(data))
      .catch((e) => {
        const err = e as ApiError;
        if (err.status === 401) {
          clear();
          router.push('/login');
          return;
        }
        setError(err.message);
      });
  }, [token, clear, router]);

  useEffect(() => {
    if (!token) return;
    if (!customerQ) {
      setCustomerOptions([]);
      return;
    }

    const t = setTimeout(() => {
      apiFetch<CustomerLite[]>(`/customers/autocomplete?q=${encodeURIComponent(customerQ)}`, { token })
        .then((data) => setCustomerOptions(data))
        .catch(() => setCustomerOptions([]));
    }, 250);

    return () => clearTimeout(t);
  }, [token, customerQ]);

  function updateItem(index: number, patch: Partial<QuotationItemDraft>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { equipmentId: '', quantity: 1, manualPrice: '0', rentalDays: 1 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const payload = {
        customerId,
        rentalStartDate,
        rentalEndDate,
        deliveryFee: deliveryFee || undefined,
        operatorFee: operatorFee || undefined,
        discount: discount || undefined,
        securityDeposit: securityDeposit || undefined,
        items: items
          .filter((i) => i.equipmentId)
          .map((i) => ({
            equipmentId: i.equipmentId,
            quantity: i.quantity,
            manualPrice: i.manualPrice,
            rentalDays: i.rentalDays,
          })),
      };

      const res = await apiFetch<{ id: string }>('/quotations', {
        method: 'POST',
        token,
        body: JSON.stringify(payload),
      });
      router.push(`/quotations/${res.id}`);
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
        <PageHeader title="New Quotation" description="Select customer, rental period, and equipment (manual price)." />

        <Card elevated>
          <form className="space-y-6" onSubmit={submit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Customer search</Label>
                <div className="mt-1">
                  <Input
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    placeholder="Type name/phone/company…"
                  />
                </div>
                {customerOptions.length > 0 ? (
                  <div className="mt-2 rounded-xl border border-border bg-background p-2 text-sm">
                    {customerOptions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={
                          'w-full rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted ' +
                          (customerId === c.id ? 'bg-muted' : '')
                        }
                        onClick={() => {
                          setCustomerId(c.id);
                          setCustomerQuery(`${c.fullName}${c.companyName ? ` (${c.companyName})` : ''}`);
                          setCustomerOptions([]);
                        }}
                      >
                        <div className="font-semibold">{c.fullName}</div>
                        <div className="text-muted-foreground">
                          {c.companyName ?? '—'} {c.phone ? ` · ${c.phone}` : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Start date</Label>
                  <div className="mt-1">
                    <Input value={rentalStartDate} onChange={(e) => setRentalStartDate(e.target.value)} placeholder="2026-02-01" required />
                  </div>
                </div>
                <div>
                  <Label>End date</Label>
                  <div className="mt-1">
                    <Input value={rentalEndDate} onChange={(e) => setRentalEndDate(e.target.value)} placeholder="2026-02-03" required />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">Equipment items</div>
                <Button type="button" variant="secondary" onClick={addItem}>
                  Add item
                </Button>
              </div>

              <div className="mt-3 space-y-3">
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-background p-3 md:grid-cols-5">
                    <div className="md:col-span-2">
                      <Label>Equipment</Label>
                      <div className="mt-1">
                        <Select value={it.equipmentId} onChange={(e) => updateItem(idx, { equipmentId: e.target.value })}>
                          <option value="">Select…</option>
                          {equipment.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.name} ({e.status})
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Qty</Label>
                      <div className="mt-1">
                        <Input
                          inputMode="numeric"
                          value={String(it.quantity)}
                          onChange={(e) => updateItem(idx, { quantity: Number(e.target.value || 1) })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Price</Label>
                      <div className="mt-1">
                        <Input inputMode="decimal" value={it.manualPrice} onChange={(e) => updateItem(idx, { manualPrice: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <Label>Days</Label>
                      <div className="mt-1 flex gap-2">
                        <Input
                          inputMode="numeric"
                          value={String(it.rentalDays)}
                          onChange={(e) => updateItem(idx, { rentalDays: Number(e.target.value || 1) })}
                        />
                        {items.length > 1 ? (
                          <Button type="button" variant="danger" onClick={() => removeItem(idx)}>
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <Label>Delivery fee</Label>
                <div className="mt-1">
                  <Input inputMode="decimal" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Operator fee</Label>
                <div className="mt-1">
                  <Input inputMode="decimal" value={operatorFee} onChange={(e) => setOperatorFee(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Discount</Label>
                <div className="mt-1">
                  <Input inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Security deposit</Label>
                <div className="mt-1">
                  <Input inputMode="decimal" value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value)} />
                </div>
              </div>
            </div>

            <ErrorBox message={error} />

            <div className="flex gap-3">
              <Button type="submit" disabled={loading || !customerId}>
                {loading ? 'Creating…' : 'Create quotation'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.push('/quotations')}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}

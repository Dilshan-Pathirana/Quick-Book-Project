'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Badge, Button, Card, ErrorBox, Money, PageHeader } from '@/components/ui';
import { apiFetch, ApiError } from '@/lib/api';
import { useProtected } from '@/lib/use-protected';

type Quotation = {
  id: string;
  quotationNumber: string;
  status: string;
  rentalStartDate: string;
  rentalEndDate: string;
  subtotal: string;
  vatAmount: string;
  discount: string;
  totalAmount: string;
  customer: { id: string; fullName: string; companyName?: string | null; email?: string | null; whatsappNumber?: string | null };
  items: Array<{ id: string; quantity: number; manualPrice?: string | null; rentalDays: number; lineTotal: string; equipment: { id: string; name: string } }>;
};

export default function QuotationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { token, clear } = useProtected();

  const [q, setQ] = useState<Quotation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    apiFetch<Quotation>(`/quotations/${id}`, { token })
      .then((data) => {
        if (!cancelled) setQ(data);
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

  async function convert() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const inv = await apiFetch<{ id: string }>(`/quotations/${id}/convert-to-invoice`, {
        method: 'POST',
        token,
      });
      router.push(`/invoices/${inv.id}`);
    } catch (e) {
      const err = e as ApiError;
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function sendEmail() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/quotations/${id}/send-email`, { method: 'POST', token });
    } catch (e) {
      const err = e as ApiError;
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function sendWhatsapp() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/quotations/${id}/send-whatsapp`, { method: 'POST', token });
    } catch (e) {
      const err = e as ApiError;
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!token) return;
    if (!confirm('Delete this quotation?')) return;
    await apiFetch(`/quotations/${id}`, { method: 'DELETE', token });
    router.push('/quotations');
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Quotation" description="Quotation → Invoice workflow.">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={sendEmail} disabled={busy}>
              Send email
            </Button>
            <Button variant="secondary" onClick={sendWhatsapp} disabled={busy}>
              Send WhatsApp
            </Button>
            <Button onClick={convert} disabled={busy}>
              Convert to invoice
            </Button>
            <Button variant="danger" onClick={del}>
              Delete
            </Button>
          </div>
        </PageHeader>

        <ErrorBox message={error} />

        {q ? (
          <>
            <Card elevated>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">{q.quotationNumber}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    <Link href={`/customers/${q.customer.id}`} className="font-semibold">
                      {q.customer.fullName}
                    </Link>
                    {q.customer.companyName ? ` · ${q.customer.companyName}` : ''}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="primary" dot>{q.status}</Badge>
                    <Badge variant="default">
                      {q.rentalStartDate.slice(0, 10)} → {q.rentalEndDate.slice(0, 10)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold">Total: LKR {q.totalAmount}</div>
                  <div className="text-muted-foreground">VAT: {q.vatAmount}</div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="text-sm font-semibold text-foreground">Items</div>
              <div className="mt-3 space-y-2 text-sm">
                {q.items.map((it) => (
                  <div key={it.id} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background p-3">
                    <div>
                      <div className="font-semibold">{it.equipment.name}</div>
                      <div className="mt-1 text-muted-foreground">
                        Qty {it.quantity} · Days {it.rentalDays} · Price {it.manualPrice ?? '0'}
                      </div>
                    </div>
                    <div className="font-semibold">LKR {it.lineTotal}</div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">Loading…</div>
        )}
      </div>
    </AppShell>
  );
}

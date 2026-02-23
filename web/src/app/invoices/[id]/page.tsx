'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Badge, Button, Card, ErrorBox, Input, Label, Money, PageHeader, Select } from '@/components/ui';
import { apiFetch, ApiError } from '@/lib/api';
import { useProtected } from '@/lib/use-protected';

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  invoiceDate: string;
  dueDate?: string | null;
  subtotal: string;
  vatAmount: string;
  discount: string;
  totalAmount: string;
  amountPaid: string;
  balanceDue: string;
  pdfUrl?: string | null;
  customer: {
    id: string;
    fullName: string;
    companyName?: string | null;
    email?: string | null;
    whatsappNumber?: string | null;
  };
  items: Array<{
    id: string;
    description?: string | null;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
    equipment?: { id: string; name: string } | null;
  }>;
  payments: Array<{ id: string; paymentDate: string; paymentMethod: string; amount: string; referenceNumber?: string | null }>;
};

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { token, clear } = useProtected();

  const [inv, setInv] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [payDate, setPayDate] = useState('');
  const [payMethod, setPayMethod] = useState<'CASH' | 'BANK' | 'TRANSFER' | 'WALLET'>('CASH');
  const [payAmount, setPayAmount] = useState('');
  const [payRef, setPayRef] = useState('');

  async function reload() {
    if (!token) return;
    const data = await apiFetch<Invoice>(`/invoices/${id}`, { token });
    setInv(data);
  }

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    apiFetch<Invoice>(`/invoices/${id}`, { token })
      .then((data) => {
        if (!cancelled) setInv(data);
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

  async function generatePdf() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/invoices/${id}/generate-pdf`, { method: 'POST', token });
      await reload();
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
      await apiFetch(`/invoices/${id}/send-email`, { method: 'POST', token });
      await reload();
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
      await apiFetch(`/invoices/${id}/send-whatsapp`, { method: 'POST', token });
      await reload();
    } catch (e) {
      const err = e as ApiError;
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function addPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch('/payments', {
        method: 'POST',
        token,
        body: JSON.stringify({
          invoiceId: id,
          paymentDate: payDate,
          paymentMethod: payMethod,
          amount: payAmount,
          referenceNumber: payRef || undefined,
        }),
      });
      await reload();
      setPayAmount('');
      setPayRef('');
    } catch (e) {
      const err = e as ApiError;
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Invoice" description="PDF + delivery + payments.">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={generatePdf} disabled={busy}>
              Generate PDF
            </Button>
            <Button variant="secondary" onClick={sendEmail} disabled={busy}>
              Send email
            </Button>
            <Button variant="secondary" onClick={sendWhatsapp} disabled={busy}>
              Send WhatsApp
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!token) return;
                if (!confirm('Delete this invoice?')) return;
                await apiFetch(`/invoices/${id}`, { method: 'DELETE', token });
                router.push('/invoices');
              }}
            >
              Delete
            </Button>
          </div>
        </PageHeader>

        <ErrorBox message={error} />

        {inv ? (
          <>
            <Card elevated>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">{inv.invoiceNumber}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    <Link href={`/customers/${inv.customer.id}`} className="font-semibold">
                      {inv.customer.fullName}
                    </Link>
                    {inv.customer.companyName ? ` · ${inv.customer.companyName}` : ''}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="primary" dot>{inv.status}</Badge>
                    <Badge variant="default">{inv.invoiceDate.slice(0, 10)}</Badge>
                    {inv.dueDate ? <Badge variant="default">Due {inv.dueDate.slice(0, 10)}</Badge> : null}
                  </div>
                  {inv.pdfUrl ? (
                    <div className="mt-3 text-sm">
                      <a className="font-semibold underline" href={inv.pdfUrl} target="_blank" rel="noreferrer">
                        Open PDF
                      </a>
                    </div>
                  ) : null}
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold">Total: LKR {inv.totalAmount}</div>
                  <div className="text-muted-foreground">Paid: {inv.amountPaid}</div>
                  <div className="text-muted-foreground">Balance: {inv.balanceDue}</div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="text-sm font-semibold text-foreground">Items</div>
              <div className="mt-3 space-y-2 text-sm">
                {inv.items.map((it) => (
                  <div key={it.id} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background p-3">
                    <div>
                      <div className="font-semibold">
                        {it.description ?? it.equipment?.name ?? 'Item'}
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        Qty {it.quantity} · Unit {it.unitPrice}
                      </div>
                    </div>
                    <div className="font-semibold">LKR {it.lineTotal}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <div>Subtotal: {inv.subtotal}</div>
                <div className="sm:text-right">Discount: {inv.discount}</div>
                <div>VAT: {inv.vatAmount}</div>
                <div className="sm:text-right">Total: {inv.totalAmount}</div>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <div className="text-sm font-semibold text-foreground">Payments</div>
                <div className="mt-3 space-y-2 text-sm">
                  {inv.payments.map((p) => (
                    <div key={p.id} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background p-3">
                      <div>
                        <div className="font-semibold">{p.paymentDate.slice(0, 10)}</div>
                        <div className="mt-1 text-muted-foreground">
                          {p.paymentMethod}
                          {p.referenceNumber ? ` · ${p.referenceNumber}` : ''}
                        </div>
                      </div>
                      <div className="font-semibold">LKR {p.amount}</div>
                    </div>
                  ))}
                  {inv.payments.length === 0 ? (
                    <div className="text-muted-foreground">No payments recorded.</div>
                  ) : null}
                </div>
              </Card>

              <Card>
                <div className="text-sm font-semibold text-foreground">Add payment</div>
                <form className="mt-3 space-y-3" onSubmit={addPayment}>
                  <div>
                    <Label>Date</Label>
                    <div className="mt-1">
                      <Input value={payDate} onChange={(e) => setPayDate(e.target.value)} placeholder="2026-02-23" required />
                    </div>
                  </div>
                  <div>
                    <Label>Method</Label>
                    <div className="mt-1">
                      <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value as any)}>
                        <option value="CASH">Cash</option>
                        <option value="BANK">Bank</option>
                        <option value="TRANSFER">Transfer</option>
                        <option value="WALLET">Wallet</option>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <div className="mt-1">
                      <Input inputMode="decimal" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required />
                    </div>
                  </div>
                  <div>
                    <Label>Reference (optional)</Label>
                    <div className="mt-1">
                      <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} />
                    </div>
                  </div>
                  <Button type="submit" disabled={busy}>
                    Record payment
                  </Button>
                </form>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">Loading…</div>
        )}
      </div>
    </AppShell>
  );
}

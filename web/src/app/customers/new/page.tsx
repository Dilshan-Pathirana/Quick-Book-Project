'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Button, Card, ErrorBox, Input, Label, PageHeader, Select, Textarea } from '@/components/ui';
import { apiFetch, ApiError } from '@/lib/api';
import { useProtected } from '@/lib/use-protected';

export default function NewCustomerPage() {
  const router = useRouter();
  const { token, clear } = useProtected();

  const [customerType, setCustomerType] = useState<'INDIVIDUAL' | 'COMPANY'>('INDIVIDUAL');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [nicOrBr, setNicOrBr] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ id: string }>('/customers', {
        method: 'POST',
        token,
        body: JSON.stringify({
          customerType,
          fullName,
          companyName: companyName || undefined,
          nicOrBr: nicOrBr || undefined,
          phone: phone || undefined,
          whatsappNumber: whatsappNumber || undefined,
          email: email || undefined,
          address: address || undefined,
          creditLimit: creditLimit || undefined,
          notes: notes || undefined,
        }),
      });
      router.push(`/customers/${res.id}`);
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
        <PageHeader title="New Customer" description="Add customer details as required by the SRS." />

        <Card elevated>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={submit}>
            <div>
              <Label>Customer type</Label>
              <Select className="mt-1" value={customerType} onChange={(e) => setCustomerType(e.target.value as any)}>
                <option value="INDIVIDUAL">Individual</option>
                <option value="COMPANY">Company</option>
              </Select>
            </div>

            <div>
              <Label>Full name</Label>
              <Input className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>

            <div>
              <Label>Company name (optional)</Label>
              <Input className="mt-1" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>

            <div>
              <Label>NIC / BR</Label>
              <Input className="mt-1" value={nicOrBr} onChange={(e) => setNicOrBr(e.target.value)} />
            </div>

            <div>
              <Label>Phone</Label>
              <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div>
              <Label>WhatsApp</Label>
              <Input className="mt-1" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
            </div>

            <div>
              <Label>Email</Label>
              <Input className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <Label>Credit limit (LKR)</Label>
              <Input className="mt-1" inputMode="decimal" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} placeholder="0" />
            </div>

            <div className="md:col-span-2">
              <Label>Address</Label>
              <Textarea className="mt-1" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <Label>Notes</Label>
              <Textarea className="mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <ErrorBox message={error} />
            </div>

            <div className="md:col-span-2 flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving…' : 'Save Customer'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/customers')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}

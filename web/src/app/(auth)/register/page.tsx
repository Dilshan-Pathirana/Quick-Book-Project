'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { setToken } from '@/lib/auth';
import { Button, Card, ErrorBox, Input, Label } from '@/components/ui';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('Owner User');
  const [email, setEmail] = useState('owner2@example.com');
  const [password, setPassword] = useState('password123');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ accessToken: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, password, phone: phone || undefined }),
      });
      setToken(res.accessToken);
      router.push('/dashboard');
    } catch (e) {
      const err = e as ApiError;
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-primary p-12">
        <div className="max-w-md text-primary-foreground">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl font-bold backdrop-blur-sm">
            Q
          </div>
          <h1 className="mt-8 text-4xl font-bold leading-tight">
            Get Started with QuickBook
          </h1>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Create your account and start managing equipment rentals, invoicing, and finances today.
          </p>
          <div className="mt-10 space-y-4 text-sm text-primary-foreground/70">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-primary-foreground">1</div>
              <span>Create your owner account</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-primary-foreground">2</div>
              <span>Add equipment & customers</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-primary-foreground">3</div>
              <span>Start creating quotations & invoices</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-primary-foreground">
              Q
            </div>
            <h2 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
              Create account
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              First user becomes OWNER with full access.
            </p>
          </div>

          <Card elevated>
            <form className="space-y-5" onSubmit={onSubmit}>
              <div>
                <Label>Full name</Label>
                <Input className="mt-1.5" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div>
                <Label>Email</Label>
                <Input className="mt-1.5" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  className="mt-1.5"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Phone (optional)</Label>
                <Input className="mt-1.5" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <ErrorBox message={error} />

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating…' : 'Create account'}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  className="font-semibold text-primary hover:text-primary-hover transition-colors"
                  href="/login"
                >
                  Sign in
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

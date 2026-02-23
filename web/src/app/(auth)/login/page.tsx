'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { setToken } from '@/lib/auth';
import { Button, Card, ErrorBox, Input, Label } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('owner@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
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
            QuickBook Rental Management
          </h1>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Streamline your equipment rentals, invoicing, and financial reporting in one unified platform.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-6 text-sm text-primary-foreground/70">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-white/50" />
              <span>Invoice Management</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-white/50" />
              <span>Equipment Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-white/50" />
              <span>Financial Reports</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-white/50" />
              <span>Customer CRM</span>
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
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to manage rentals, invoices, and accounts.
            </p>
          </div>

          <Card elevated>
            <form className="space-y-5" onSubmit={onSubmit}>
              <div>
                <Label>Email address</Label>
                <Input
                  className="mt-1.5"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  className="mt-1.5"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <ErrorBox message={error} />

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                New here?{' '}
                <Link className="font-semibold text-primary hover:text-primary-hover transition-colors" href="/register">
                  Create an account
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

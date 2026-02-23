'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PropsWithChildren, useMemo, useState } from 'react';
import { clearToken } from '@/lib/auth';
import { useAuthToken } from '@/lib/auth';
import { useMe } from '@/lib/me';
import { Avatar } from '@/components/ui';

/* ── SVG Icon helpers (inline, no dependency) ── */
function Icon({ d, className = 'h-5 w-5' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const icons: Record<string, string> = {
  '/dashboard': 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  '/customers': 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  '/equipment': 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  '/rentals': 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  '/quotations': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  '/invoices': 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
  '/accounting': 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  '/analytics': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  '/reports': 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
  '/users': 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
};

type NavItem = { href: string; label: string };

type NavGroup = { group: string; items: NavItem[] };

const baseNavGroups: NavGroup[] = [
  {
    group: 'OPERATIONS',
    items: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/customers', label: 'Customers' },
      { href: '/equipment', label: 'Equipment' },
      { href: '/rentals', label: 'Rentals' },
    ],
  },
  {
    group: 'TRANSACTIONS',
    items: [
      { href: '/quotations', label: 'Quotations' },
      { href: '/invoices', label: 'Invoices' },
    ],
  },
  {
    group: 'FINANCE',
    items: [
      { href: '/accounting', label: 'Accounting' },
      { href: '/analytics', label: 'Analytics' },
      { href: '/reports', label: 'Reports' },
    ],
  },
];

function flatten(groups: NavGroup[]) {
  return groups.flatMap((g) => g.items);
}

/* ── Mobile bottom nav icons (compact) ── */
const mobileIcons: Record<string, string> = icons;

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { token } = useAuthToken();
  const { me } = useMe(token);

  const visibleGroups = useMemo(() => {
    const groups: NavGroup[] = baseNavGroups.map((g) => ({ ...g, items: [...g.items] }));
    if (me?.role?.name === 'OWNER') {
      groups.push({ group: 'ADMIN', items: [{ href: '/users', label: 'Users' }] });
    }
    return groups;
  }, [me]);

  const visibleNav = useMemo(() => flatten(visibleGroups), [visibleGroups]);

  const active = useMemo(() => {
    const match = visibleNav.find((n) => pathname?.startsWith(n.href));
    return match?.href ?? '/dashboard';
  }, [pathname, visibleNav]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden md:flex md:w-[260px] md:flex-col md:fixed md:inset-y-0 z-30">
        <div className="flex flex-1 flex-col border-r border-border bg-card">
          {/* Brand */}
          <div className="flex h-16 items-center gap-3 border-b border-border px-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg shadow-sm">
              Q
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-foreground">Quick Book</div>
              <div className="text-[10px] font-medium text-muted-foreground tracking-wider">FINANCE SYSTEM</div>
            </div>
          </div>

          {/* Nav groups */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {visibleGroups.map((group) => (
              <div key={group.group} className="mb-6">
                <div className="mb-2 px-3 text-[10px] font-bold tracking-[0.15em] text-muted-foreground/70 uppercase">
                  {group.group}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = item.href === active;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={
                          'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ' +
                          (isActive
                            ? 'bg-primary/10 text-primary shadow-sm'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground')
                        }
                      >
                        <span className={isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}>
                          <Icon d={icons[item.href] ?? ''} className="h-[18px] w-[18px]" />
                        </span>
                        <span>{item.label}</span>
                        {isActive && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User section at bottom */}
          {me && (
            <div className="border-t border-border p-4">
              <div className="flex items-center gap-3">
                <Avatar name={me.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{me.fullName}</div>
                  <div className="truncate text-xs text-muted-foreground">{me.role?.name}</div>
                </div>
                <button
                  onClick={() => {
                    clearToken();
                    router.push('/login');
                  }}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Logout"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col md:pl-[260px]">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
          {/* Mobile hamburger */}
          <button
            className="md:hidden rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Breadcrumb area */}
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground capitalize">
              {pathname?.split('/').filter(Boolean)[0] ?? 'Dashboard'}
            </span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {me && (
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{me.fullName}</span>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {me.role?.name}
                </span>
              </div>
            )}
            <button
              className="md:hidden rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              onClick={() => {
                clearToken();
                router.push('/login');
              }}
              title="Logout"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-[280px] bg-card border-r border-border shadow-xl flex flex-col">
              <div className="flex h-14 items-center gap-3 border-b border-border px-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                  Q
                </div>
                <span className="text-base font-bold text-foreground">Quick Book</span>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-4">
                {visibleGroups.map((group) => (
                  <div key={group.group} className="mb-6">
                    <div className="mb-2 px-3 text-[10px] font-bold tracking-[0.15em] text-muted-foreground/70 uppercase">
                      {group.group}
                    </div>
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const isActive = item.href === active;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileSidebarOpen(false)}
                            className={
                              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ' +
                              (isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground')
                            }
                          >
                            <Icon d={icons[item.href] ?? ''} className="h-[18px] w-[18px]" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-card/95 backdrop-blur-sm md:hidden">
        <div className="mx-auto flex max-w-lg justify-between px-2">
          {visibleNav.slice(0, 5).map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  'flex flex-1 flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] font-medium transition-colors ' +
                  (isActive ? 'text-primary' : 'text-muted-foreground')
                }
              >
                <Icon d={mobileIcons[item.href] ?? ''} className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="h-16 md:hidden" />
    </div>
  );
}

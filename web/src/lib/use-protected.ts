'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthToken } from './auth';

export function useProtected() {
  const router = useRouter();
  const { token, clear } = useAuthToken();

  useEffect(() => {
    if (token === null) return;
    if (!token) router.push('/login');
  }, [token, router]);

  return { token, clear };
}

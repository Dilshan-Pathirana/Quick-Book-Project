'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch, ApiError } from './api';

export type Me = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
  role: { name: 'OWNER' | 'ACCOUNTANT' | 'SALES' | 'INVENTORY_MANAGER'; description?: string | null };
  createdAt: string;
  updatedAt: string;
};

export function useMe(token?: string | null) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setMe(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch<Me>('/auth/me', { token })
      .then((data) => {
        if (!cancelled) setMe(data);
      })
      .catch((e) => {
        const err = e as ApiError;
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return useMemo(() => ({ me, loading, error }), [me, loading, error]);
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const TOKEN_KEY = 'qb.token';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function useAuthToken() {
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    setTokenState(getToken());
  }, []);

  const save = useCallback((t: string) => {
    setToken(t);
    setTokenState(t);
  }, []);

  const clear = useCallback(() => {
    clearToken();
    setTokenState(null);
  }, []);

  return useMemo(() => ({ token, save, clear }), [token, save, clear]);
}

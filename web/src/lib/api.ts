export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3002/api/v1';

export function getApiBase() {
  return API_BASE.replace(/\/$/, '');
}

function buildUrl(path: string) {
  if (!path.startsWith('/')) path = `/${path}`;
  return `${getApiBase()}${path}`;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const url = buildUrl(path);

  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const text = await res.text();
  const maybeJson = text ? safeJsonParse(text) : undefined;

  if (!res.ok) {
    const message =
      (maybeJson && (maybeJson as any).message) || res.statusText || 'Request failed';
    const err: ApiError = {
      status: res.status,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      details: maybeJson,
    };
    throw err;
  }

  return (maybeJson ?? (text as any)) as T;
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

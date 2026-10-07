import type { AddResultBody, ResultDump } from '../types/result';
import type { AddResultResponse, PositionResponse } from '../types/position';
import type { AppUser, AuthLoginResponse } from '../types/user';
import type { Vendor } from '../types/vendor';

/**
 * API-клиент. Использует относительные пути (/api/...):
 *  - dev: Vite-прокси /api → 127.0.0.1:8787
 *  - prod: тот же origin (Deno раздаёт API + SSR одним процессом)
 * Cookies летят автоматически (same-origin), credentials:'include' — для надёжности.
 */

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    if (data && typeof data === 'object' && 'error' in data) {
      message = String((data as { error: unknown }).error);
    }
    throw new Error(message);
  }
  return data as T;
}

export function authLogin(vendor: Vendor): Promise<AuthLoginResponse> {
  return request<AuthLoginResponse>(`/api/auth/login?vendor=${vendor}`);
}

export function authExchange(
  vendor: Vendor,
  code: string,
  state: string,
): Promise<{ ok: true; user: AppUser }> {
  return request<{ ok: true; user: AppUser }>('/api/auth/exchange', {
    method: 'POST',
    body: JSON.stringify({ vendor, code, state }),
  });
}

export function authMe(): Promise<{ user: AppUser | null }> {
  return request<{ user: AppUser | null }>('/api/auth/me');
}

export function authLogout(): Promise<{ ok: true }> {
  return request<{ ok: true }>('/api/auth/logout', { method: 'POST' });
}

export function getResults(limit = 1000): Promise<{ results: ResultDump[] }> {
  return request<{ results: ResultDump[] }>(`/api/results?limit=${limit}`);
}

export function getResultPosition(
  level: number,
  labyrinth: number,
  score: number,
): Promise<PositionResponse> {
  return request<PositionResponse>(
    `/api/result/position?level=${level}&labyrinth=${labyrinth}&score=${score}`,
  );
}

export function addResult(body: AddResultBody): Promise<AddResultResponse> {
  return request<AddResultResponse>('/api/result/add', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getResult(id: number): Promise<ResultDump> {
  return request<ResultDump>(`/api/result/${id}`);
}

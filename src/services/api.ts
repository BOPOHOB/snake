const API_BASE = (process.env.REACT_APP_API_URL ?? 'http://localhost:8787').replace(/\/$/, '');

export { API_BASE };

export type Vendor = 'yandex' | 'google';

export type AppUser = {
  id: number;
  name: string;
  authVendor: Vendor;
};

export type AuthLoginResponse = {
  authorizeUrl: string;
  state: string;
  vendor: Vendor;
  redirectUri: string;
};

export type PositionResponse = {
  level: number;
  labyrinth: number;
  score: number;
  position: number;
  total: number;
  before: number;
  after: number;
};

export type ResultDump = {
  id: number;
  user_id: number;
  user_name: string;
  score: number;
  bands: unknown;
  eatens: unknown;
  tick_id: number;
  level: number;
  labyrinth: number;
  apple: unknown;
  bug: unknown;
  retryCounter: number;
  isWin: boolean;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
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

export function authExchange(vendor: Vendor, code: string, state: string): Promise<{ ok: true; user: AppUser }> {
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

export function getResultPosition(level: number, labyrinth: number, score: number): Promise<PositionResponse> {
  return request<PositionResponse>(
    `/api/result/position?level=${level}&labyrinth=${labyrinth}&score=${score}`,
  );
}

export function addResult(body: Omit<ResultDump, 'id' | 'user_id' | 'user_name'>): Promise<PositionResponse> {
  return request<PositionResponse>('/api/result/add', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getResult(id: number): Promise<ResultDump> {
  return request<ResultDump>(`/api/result/${id}`);
}

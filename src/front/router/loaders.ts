import type { LoaderFunctionArgs } from 'react-router-dom';
import type { ResultDump } from '../types/result';
import type { PositionResponse } from '../types/position';

/** SSR/CSR-агностичный fetch: на сервере — по origin запроса, в браузере — относительный. */
export async function apiFetch<T>(
  request: Request,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = new URL(path, new URL(request.url).origin);
  const res = await fetch(url, {
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
    const message =
      data && typeof data === 'object' && 'error' in data
        ? String((data as { error: unknown }).error)
        : `HTTP ${res.status}`;
    throw new Response(JSON.stringify({ error: message }), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return data as T;
}

export async function loadResults(
  args: LoaderFunctionArgs,
  limit = 1000,
): Promise<{ results: ResultDump[] }> {
  return apiFetch<{ results: ResultDump[] }>(
    args.request,
    `/api/results?limit=${limit}`,
  );
}

export async function loadResult(
  args: LoaderFunctionArgs,
): Promise<{ result: ResultDump | null; position: PositionResponse | null }> {
  const id = args.params.id;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId < 1) {
      return { result: null, position: null };
  }
  try {
    const result = await apiFetch<ResultDump>(
      args.request,
      `/api/result/${numId}`,
    );
    const position = await apiFetch<PositionResponse>(
      args.request,
      `/api/result/position?level=${result.level}&labyrinth=${result.labyrinth}&score=${result.score}`,
    ).catch(() => null);
    return { result, position };
  } catch {
    return { result: null, position: null };
  }
}

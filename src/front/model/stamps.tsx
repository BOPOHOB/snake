import { createContext, useContext, useSyncExternalStore, type FC, type PropsWithChildren } from 'react';
import type { Stamp } from '../types/stamp';
import { addResult } from '../services/api';
import { useModel } from '../utils/useModel';

const STORAGE_KEY = 'stamp';

export type StampEntry = {
  stamp: Stamp;
  sent: boolean;
  resultId?: number;
};

type StampsSnapshot = {
  total: number;
  unsent: number;
};

function readEntries(): StampEntry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Толерантно к старому формату (массив plain stamp'ов) — помечаем как unsent.
    return parsed.map((item) =>
      item && typeof item === 'object' && 'stamp' in item
        ? (item as StampEntry)
        : { stamp: item as Stamp, sent: false },
    );
  } catch {
    return [];
  }
}

function writeEntries(entries: StampEntry[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

class Stamps {
  #entries: StampEntry[] = [];
  #listeners = new Set<() => void>();
  #snapshot: StampsSnapshot = { total: 0, unsent: 0 };
  #syncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.#entries = readEntries();
      this.#rebuild();
    }
  }

  subscribe = (cb: () => void): (() => void) => {
    this.#listeners.add(cb);
    return () => {
      this.#listeners.delete(cb);
    };
  };

  getSnapshot = (): StampsSnapshot => this.#snapshot;

  #rebuild(): void {
    this.#snapshot = {
      total: this.#entries.length,
      unsent: this.#entries.filter((e) => !e.sent).length,
    };
    this.#listeners.forEach((l) => l());
  }

  all(): Stamp[] {
    return this.#entries.map((e) => e.stamp);
  }

  last(): Stamp | null {
    return this.#entries.at(-1)?.stamp ?? null;
  }

  unsentCount(): number {
    return this.#entries.filter((e) => !e.sent).length;
  }

  add(stamp: Stamp): void {
    this.#entries = [...this.#entries, { stamp, sent: false }];
    writeEntries(this.#entries);
    this.#rebuild();
  }

  /** Отправка unsent-записей. Идемпотентна. Требует авторизации (caller передаёт флаг). */
  async sync(authenticated: boolean): Promise<void> {
    if (!authenticated || this.#syncing) return;
    const pending = this.#entries.filter((e) => !e.sent);
    if (pending.length === 0) return;
    this.#syncing = true;
    for (const entry of pending) {
      try {
        const res = await addResult({
          score: entry.stamp.score,
          bands: entry.stamp.bands,
          eatens: entry.stamp.eatens,
          tick_id: entry.stamp.tickId,
          level: entry.stamp.level,
          labyrinth: entry.stamp.labyrinth,
          apple: entry.stamp.apple,
          bug: entry.stamp.bug,
          retryCounter: entry.stamp.retryCounter,
          isWin: entry.stamp.isWin,
        });
        entry.sent = true;
        entry.resultId = res.id;
      } catch {
        // Не отправлено — оставим в очереди, попробуем при следующем sync.
      }
    }
    writeEntries(this.#entries);
    this.#rebuild();
    this.#syncing = false;
  }
}

const StampsContext = createContext<Stamps | null>(null);
const StampsProvider: FC<PropsWithChildren> = ({ children }) => {
  const stamps = useModel(() => new Stamps(), []);
  return <StampsContext.Provider value={stamps}>{ children }</StampsContext.Provider>;
}

function useStamps(): Stamps {
  const ctx = useContext(StampsContext);
  if (!ctx) throw new Error('useStamps must be used inside StampsProvider');
  return ctx;
}

function useStampsState(): StampsSnapshot {
  const stamps = useStamps();
  return useSyncExternalStore(stamps.subscribe, stamps.getSnapshot, stamps.getSnapshot);
}

export { Stamps, StampsContext, StampsProvider, useStamps, useStampsState };

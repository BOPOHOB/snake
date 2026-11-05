import {
  createContext,
  useContext,
  useSyncExternalStore,
  type FC,
  type PropsWithChildren,
} from 'react';
import type { ResultDump } from '../types/result';
import type { PositionResponse } from '../types/position';
import type { Stamp } from '../types/stamp';
import type { Stamps } from './stamps';

/**
 * Фокус страницы результатов — входной параметр модели.
 * - none: прямой заход на /result
 * - stamp: только что законченная игра (локальный stamp)
 * - result: результат с сервера по /result/:id
 * - missing: /result/:id, запись не найдена
 */
export type ResultsFocus =
  | { kind: 'none' }
  | {
      kind: 'stamp';
      stamp: Stamp;
      position?: PositionResponse | null;
      userName?: string | null;
    }
  | {
      kind: 'result';
      result: ResultDump;
      position?: PositionResponse | null;
    }
  | { kind: 'missing'; id: number };

/**
 * Заготовки фильтров. В первой реализации не применяются к списку:
 * лабиринты по-прежнему режутся только при отображении таблицы на 6 колонок.
 */
export type ResultsFilters = {
  labyrinth: number | null;
  level: number | null;
  /** null = все; true = retryCounter > 0; false = retryCounter === 0 */
  resurrected: boolean | null;
};

export type ResultsSnapshot = {
  /** Общий список для таблицы. */
  rows: ResultDump[];
  /** Бекенд ответил (false → rows только из локального хранилища). */
  serverOk: boolean;
  focus: ResultsFocus;
  filters: ResultsFilters;
  /** id выделенной строки в таблице (серверный или синтетический локальный). */
  selectedId: number | undefined;
};

const DEFAULT_FILTERS: ResultsFilters = {
  labyrinth: null,
  level: null,
  resurrected: null,
};

/** Локальный stamp → ResultDump с синтетическим id < 0. */
function localDump(stamp: Stamp, id: number, userName: string): ResultDump {
  return {
    ...stamp,
    id,
    user_id: 0,
    user_name: userName,
    created_at: 0,
  };
}

/**
 * Модель страницы результатов.
 * Создаётся на /result с конкретным focus; список = бекенд ∪ unsent local,
 * либо только local, если бекенд не ответил.
 */
class ResultsModel {
  #focus: ResultsFocus;
  #server: ResultDump[] | null;
  #stamps: Stamps;
  #userName: string;
  #filters: ResultsFilters = { ...DEFAULT_FILTERS };
  /** Локальные stamps подмешиваются только после mount — иначе hydration #418. */
  #includeLocal = false;
  #listeners = new Set<() => void>();
  #snapshot: ResultsSnapshot;
  #unsubStamps: (() => void) | null = null;

  constructor(opts: {
    focus: ResultsFocus;
    stamps: Stamps;
    /** null = бекенд не ответил. */
    serverResults: ResultDump[] | null;
    userName?: string;
  }) {
    this.#focus = opts.focus;
    this.#server = opts.serverResults;
    this.#stamps = opts.stamps;
    this.#userName = opts.userName ?? 'Аноним';
    this.#snapshot = this.#compute();
    this.#unsubStamps = this.#stamps.subscribe(() => {
      if (this.#includeLocal) this.#rebuild();
    });
  }

  /** Вызывать из useEffect после гидрации. */
  enableLocal = (): void => {
    if (this.#includeLocal) return;
    this.#includeLocal = true;
    this.#rebuild();
  };

  destructor = (): void => {
    this.#unsubStamps?.();
    this.#unsubStamps = null;
  };

  subscribe = (cb: () => void): (() => void) => {
    this.#listeners.add(cb);
    return () => {
      this.#listeners.delete(cb);
    };
  };

  getSnapshot = (): ResultsSnapshot => this.#snapshot;

  get focus(): ResultsFocus {
    return this.#focus;
  }

  get filters(): ResultsFilters {
    return this.#filters;
  }

  /** API для будущих фильтров — пока только хранит состояние, на rows не влияет. */
  setFilters(patch: Partial<ResultsFilters>): void {
    this.#filters = { ...this.#filters, ...patch };
    this.#rebuild();
  }

  #rebuild(): void {
    this.#snapshot = this.#compute();
    this.#listeners.forEach((l) => l());
  }

  #compute(): ResultsSnapshot {
    const serverOk = this.#server !== null;
    let rows: ResultDump[];
    if (serverOk) {
      rows = this.#includeLocal
        ? this.#mergeServerAndUnsent(this.#server!)
        : this.#server!;
    } else {
      rows = this.#includeLocal ? this.#localOnly() : [];
    }

    // Фильтры зарезервированы — применение появится позже.
    void this.#filters;

    return {
      rows,
      serverOk,
      focus: this.#focus,
      filters: this.#filters,
      selectedId: this.#selectedId(rows),
    };
  }

  #mergeServerAndUnsent(server: ResultDump[]): ResultDump[] {
    const local = this.#stamps.unsentEntries().map((entry, i) =>
      localDump(entry.stamp, -i - 1, this.#userName),
    );
    return [...server, ...local];
  }

  #localOnly(): ResultDump[] {
    return this.#stamps.entries().map((entry, i) =>
      localDump(entry.stamp, -i - 1, this.#userName),
    );
  }

  #selectedId(rows: ResultDump[]): number | undefined {
    const { focus } = this;
    if (focus.kind === 'result') return focus.result.id;
    if (focus.kind === 'missing') return focus.id;
    if (focus.kind === 'stamp') {
      const hit = rows.find(
        (r) =>
          r.id < 0 &&
          r.score === focus.stamp.score &&
          r.head === focus.stamp.head &&
          r.tick === focus.stamp.tick &&
          r.labyrinth === focus.stamp.labyrinth &&
          r.level === focus.stamp.level,
      );
      return hit?.id;
    }
    return undefined;
  }
}

const ResultsModelContext = createContext<ResultsModel | null>(null);

type ResultsModelProviderProps = PropsWithChildren<{
  model: ResultsModel;
}>;

const ResultsModelProvider: FC<ResultsModelProviderProps> = ({
  model,
  children,
}) => (
  <ResultsModelContext.Provider value={model}>
    {children}
  </ResultsModelContext.Provider>
);

function useResultsModel(): ResultsModel {
  const ctx = useContext(ResultsModelContext);
  if (!ctx) throw new Error('useResultsModel must be used inside ResultsModelProvider');
  return ctx;
}

function useResultsState(): ResultsSnapshot {
  const model = useResultsModel();
  return useSyncExternalStore(model.subscribe, model.getSnapshot, model.getSnapshot);
}

export {
  ResultsModel,
  ResultsModelProvider,
  useResultsModel,
  useResultsState,
};

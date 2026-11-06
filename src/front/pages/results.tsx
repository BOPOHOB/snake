import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
  useRouteLoaderData,
} from 'react-router-dom';
import { ResultCard } from '../components/results/ResultCard';
import { Results as ResultsTable } from '../components/results/Results';
import { Achievements } from '../components/achievements/Achievements';
import {
  ResultsModel,
  ResultsModelProvider,
  useResultsState,
  type ResultsFocus,
} from '../model/results';
import { useStamps } from '../model/stamps';
import { useSessionState } from '../model/session';
import type { ResultDump } from '../types/result';
import type { PositionResponse } from '../types/position';
import type { Stamp } from '../types/stamp';

import cn from './results.module.less';

type ResultsLoaderData = {
  results: ResultDump[] | null;
};

type ResultLoaderData = {
  result: ResultDump | null;
  position: PositionResponse | null;
};

type LocationState = {
  justFinished?: boolean;
  stamp?: Stamp;
  position?: PositionResponse | null;
  userName?: string | null;
};

function resolveFocus(opts: {
  id: string | undefined;
  loaded: ResultLoaderData | undefined;
  state: LocationState | null;
  lastStamp: Stamp | null;
  lastPosition: PositionResponse | null | undefined;
  userName: string | null;
}): ResultsFocus | 'pending' {
  const { id, loaded, state, lastStamp, lastPosition, userName } = opts;

  // /result/:id — модель только после ответа лоадера.
  if (id) {
    if (loaded === undefined) return 'pending';
    if (loaded.result) {
      // После game-over replace на :id может нести stamp в state — карточка без мигания.
      if (state?.stamp) {
        return {
          kind: 'stamp',
          stamp: state.stamp,
          position: state.position ?? loaded.position,
          userName: state.userName ?? userName,
        };
      }
      return {
        kind: 'result',
        result: loaded.result,
        position: loaded.position,
      };
    }
    return { kind: 'missing', id: Number(id) };
  }

  // Stamp во входном state: после игры или клик по локальной строке таблицы.
  if (state?.stamp) {
    return {
      kind: 'stamp',
      stamp: state.stamp,
      position: state.position ?? lastPosition ?? null,
      userName: state.userName ?? userName,
    };
  }
  if (state?.justFinished && lastStamp) {
    return {
      kind: 'stamp',
      stamp: lastStamp,
      position: lastPosition ?? null,
      userName,
    };
  }

  // Прямой заход на /result.
  return { kind: 'none' };
}

const ResultsBody = () => {
  const snap = useResultsState();
  const { focus } = snap;

  let card: ReactNode = null;
  if (focus.kind === 'stamp') {
    card = (
      <ResultCard
        stamp={focus.stamp}
        userName={focus.userName}
        position={focus.position}
      />
    );
  } else if (focus.kind === 'result') {
    card = (
      <ResultCard
        stamp={focus.result}
        userName={focus.result.user_name}
        position={focus.position}
      />
    );
  } else if (focus.kind === 'missing') {
    card = (
      <section style={{ padding: 24, textAlign: 'center' }}>
        <h2>Результат не найден</h2>
        <p>Возможно, результат был удалён или ссылка неверна.</p>
      </section>
    );
  }

  return (
    <>
      <ResultsTable results={snap.rows} selectedId={snap.selectedId} />
      <div className={cn.content}>
        {card}
        <Achievements />
      </div>
    </>
  );
};

/**
 * Страница /result и /result/:id.
 * Модель создаётся здесь: focus из stamp / loader / none / missing.
 */
export const Results = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const stamps = useStamps();
  const { user } = useSessionState();

  const resultsData = useRouteLoaderData('results') as ResultsLoaderData | undefined;
  const loaded = useRouteLoaderData('result') as ResultLoaderData | undefined;

  const state = (location.state as LocationState | null) ?? null;
  const entry = stamps.lastEntry();
  const userName = user?.name ?? null;
  /** Чтобы replace на /result/:id сработал один раз на resultId (без гонок/повторов). */
  const navigatedForId = useRef<number | null>(null);

  const focus = resolveFocus({
    id,
    loaded,
    state,
    lastStamp: entry?.stamp ?? null,
    lastPosition: entry?.position,
    userName,
  });

  // После отправки stamp на бекенд — один replace на /result/:id.
  // Лоадеры подтянутся самим переходом; отдельный revalidate() зацикливал GET'ы.
  useEffect(() => {
    if (!state?.justFinished || entry?.resultId == null) return;
    if (id === String(entry.resultId)) return;
    if (navigatedForId.current === entry.resultId) return;
    navigatedForId.current = entry.resultId;
    navigate(`/result/${entry.resultId}`, {
      replace: true,
      state: {
        justFinished: true,
        stamp: entry.stamp,
        position: entry.position ?? null,
        userName,
      },
    });
  }, [
    state?.justFinished,
    entry?.resultId,
    entry?.stamp,
    entry?.position,
    id,
    navigate,
    userName,
  ]);

  const focusKey = useMemo(() => {
    if (focus === 'pending') return 'pending';
    if (focus.kind === 'none') return 'none';
    if (focus.kind === 'missing') return `missing:${focus.id}`;
    if (focus.kind === 'result') return `result:${focus.result.id}`;
    return `stamp:${focus.stamp.tick}:${focus.stamp.head}:${focus.stamp.score}`;
  }, [focus]);

  const serverResults = resultsData?.results ?? null;

  const model = useMemo(() => {
    if (focus === 'pending') return null;
    return new ResultsModel({
      focus,
      stamps,
      serverResults,
      userName: userName ?? 'Аноним',
    });
    // focusKey стабилизирует пересоздание; stamps — синглтон провайдера.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recreate by focusKey + server payload
  }, [focusKey, stamps, serverResults, userName]);

  useEffect(() => {
    model?.enableLocal();
    return () => {
      model?.destructor();
    };
  }, [model]);

  if (!model || focus === 'pending') {
    return null;
  }

  return (
    <ResultsModelProvider model={model}>
      <ResultsBody />
    </ResultsModelProvider>
  );
};

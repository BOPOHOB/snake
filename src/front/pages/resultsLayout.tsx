import { useEffect } from 'react';
import {
  Outlet,
  useLocation,
  useNavigate,
  useParams,
  useRevalidator,
  useRouteLoaderData,
} from 'react-router-dom';
import { ResultCard } from '../components/results/ResultCard';
import { useStamps, useStampsState } from '../model/stamps';
import { useSessionState } from '../model/session';
import type { ResultDump } from '../types/result';
import type { PositionResponse } from '../types/position';
import type { Stamp } from '../types/stamp';

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

function toStamp(r: ResultDump): Stamp {
  return {
    score: r.score,
    bands: (r.bands as Stamp['bands']) ?? [],
    head: r.head,
    eatens: (r.eatens as Stamp['eatens']) ?? [],
    tickId: r.tick_id,
    level: r.level,
    labyrinth: r.labyrinth,
    apple: (r.apple as Stamp['apple']) ?? null,
    bug: (r.bug as Stamp['bug']) ?? 5,
    retryCounter: r.retryCounter,
    isWin: r.isWin,
  };
}

/**
 * Layout /result: карточка локального/серверного результата.
 * Остаётся смонтированной при replace /result → /result/:id, поэтому визуал не мигает.
 */
export const ResultsLayout = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const stamps = useStamps();
  const { user } = useSessionState();
  useStampsState();

  const state = (location.state as LocationState | null) ?? null;
  const justFinished = Boolean(state?.justFinished) || Boolean(state?.stamp);
  const entry = stamps.lastEntry();
  const loaded = useRouteLoaderData('result') as ResultLoaderData | undefined;

  useEffect(() => {
    if (!state?.justFinished || entry?.resultId == null) return;
    if (id === String(entry.resultId)) return;
    const nextId = entry.resultId;
    const stamp = entry.stamp;
    const position = entry.position ?? null;
    void Promise.resolve(revalidator.revalidate()).finally(() => {
      navigate(`/result/${nextId}`, {
        replace: true,
        state: {
          justFinished: true,
          stamp,
          position,
          userName: user?.name ?? null,
        },
      });
    });
  }, [
    state?.justFinished,
    entry?.resultId,
    entry?.stamp,
    entry?.position,
    id,
    navigate,
    revalidator,
    user?.name,
  ]);

  let stamp: Stamp | null = null;
  let position: PositionResponse | null = null;
  let userName: string | null = null;

  if (state?.stamp) {
    stamp = state.stamp;
    position = state.position ?? null;
    userName = state.userName ?? user?.name ?? null;
  } else if (justFinished && entry) {
    stamp = entry.stamp;
    position = entry.position ?? null;
    userName = user?.name ?? null;
  } else if (loaded?.result) {
    stamp = toStamp(loaded.result);
    position = loaded.position;
    userName = loaded.result.user_name || null;
  } else if (id && !loaded?.result) {
    return (
      <>
        <section style={{ padding: 24, textAlign: 'center' }}>
          <h2>Результат не найден</h2>
          <p>Возможно, результат был удалён или ссылка неверна.</p>
        </section>
        <Outlet />
      </>
    );
  }

  return (
    <>
      {stamp && <ResultCard stamp={stamp} userName={userName} position={position} />}
      <Outlet />
    </>
  );
};

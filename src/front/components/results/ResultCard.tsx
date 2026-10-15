import type { Stamp } from '../../types/stamp';
import type { PositionResponse } from '../../types/position';
import { MiniField } from './MiniField';

type ResultCardProps = {
  stamp: Stamp;
  userName?: string | null;
  position?: PositionResponse | null;
};

/** Карточка одного результата — одна и та же для локального stamp и /result/:id. */
const ResultCard = ({ stamp, userName, position }: ResultCardProps) => (
  <section style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
    <MiniField stamp={stamp} />
    <dl style={{ marginTop: 16 }}>
      <div>
        <dt>Player</dt>
        <dd>{userName || 'Аноним'}</dd>
      </div>
      <div>
        <dt>Score</dt>
        <dd>{stamp.score}</dd>
      </div>
      <div>
        <dt>Level</dt>
        <dd>{stamp.level}</dd>
      </div>
      <div>
        <dt>Labyrinth</dt>
        <dd>{stamp.labyrinth}</dd>
      </div>
      <div>
        <dt>Position</dt>
        <dd>{position ? `#${position.position} of ${position.total}` : '—'}</dd>
      </div>
      <div>
        <dt>Retry</dt>
        <dd>{stamp.retryCounter === 0 ? 'no retry' : `${stamp.retryCounter}`}</dd>
      </div>
    </dl>
  </section>
);

export { ResultCard };

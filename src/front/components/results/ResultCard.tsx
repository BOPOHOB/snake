import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { Stamp } from '../../types/stamp';
import type { PositionResponse } from '../../types/position';
import { MiniField } from './MiniField';
import cn from './resultCard.module.less';
import { Achievements } from '../achievements/Achievements';

type ResultCardProps = {
  stamp: Stamp;
  userName?: string | null;
  position?: PositionResponse | null;
};

/** Карточка одного результата — одна и та же для локального stamp и /result/:id. */
const ResultCard = ({ stamp, userName, position }: ResultCardProps) => {
  const navigate = useNavigate();
  const canResurrect = (stamp.eatens?.length ?? 0) >= 10;

  const onStart = () => navigate('/');
  const onResurrect = () => {
    navigate('/', { state: { resurrect: stamp } });
  }

  return (
    <section className={cn.resultCard}>
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
          <dt>Position</dt>
          <dd>{position ? `#${position.position} of ${position.total}` : '—'}</dd>
        </div>
        <div>
          <dt>Resurrections</dt>
          <dd>{stamp.retryCounter === 0 ? 'one life' : `${stamp.retryCounter}`}</dd>
        </div>
      </dl>
      <div className={cn.buttons}>
        <Button autoFocus onClick={onStart}>New game</Button>
        {canResurrect && <Button onClick={onResurrect}>Resurrect</Button>}
      </div>
      <Achievements />
    </section>
  );
};

export { ResultCard };

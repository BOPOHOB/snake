import { useEffect, useState } from 'react';
import { BitScene } from '../elements/BitScene';
import classNames from 'classnames';
import cn from './achievements.module.less';
import { achievements } from '../../services/achivements/achivements';

type AchievementLike = {
  isResurrected: boolean;
  isFinished: boolean;
  name: string;
  icon: number[][];
  details: string;
  progress: { all: number; now: number } | null;
};

const Achievement = ({ achivement }: { achivement: AchievementLike }) => {
  const resurrected = achivement.isResurrected && achivement.isFinished;
  return (
    <li
      className={classNames({
        [cn.resurrected]: resurrected,
        [cn.finished]: achivement.isFinished || true,
      })}
    >
      <BitScene
        width={70}
        height={70}
        bg={resurrected ? 'white' : undefined}
        data={achivement.icon}
      />
      <h3>
        {achivement.name}
        {!achivement.isFinished && achivement.progress
          ? ` (${achivement.progress.now} / ${achivement.progress.all})`
          : ''}
      </h3>
      <p>{achivement.details}</p>
    </li>
  );
};

const Achievements = () => {
  // Первый кадр совпадает с SSR (без localStorage); после mount — переигровка stamp'ов.
  const [, setHydrated] = useState(0);
  useEffect(() => {
    achievements.hydrateFromStorage();
    setHydrated((n) => n + 1);
  }, []);

  return (
    <ul className={cn.wrap}>
      {[...achievements.results()].map((achivement, id) => (
        <Achievement key={id} achivement={achivement as AchievementLike} />
      ))}
    </ul>
  );
};

export { Achievements };

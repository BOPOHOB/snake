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

const Achievement = ({ achievement }: { achievement: AchievementLike }) => {
  const resurrected = achievement.isResurrected && achievement.isFinished;
  return (
    <li
      className={classNames({
        [cn.resurrected]: resurrected,
        [cn.finished]: achievement.isFinished,
      })}
    >
      <BitScene
        width={70}
        height={70}
        bg={resurrected ? 'white' : undefined}
        data={achievement.icon}
      />
      <h3>
        {achievement.name}
        {!achievement.isFinished && achievement.progress
          ? ` (${achievement.progress.now} / ${achievement.progress.all})`
          : ''}
      </h3>
      <p>{achievement.details}</p>
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
      {[...achievements.results()].map((achievement, id) => (
        <Achievement key={id} achievement={achievement as AchievementLike} />
      ))}
    </ul>
  );
};

export { Achievements };

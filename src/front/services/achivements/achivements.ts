import { assets } from '../../components/game/assets';
import type { Stamp } from '../../types/stamp';
import { Achievement } from './achivement';
import { ICONS } from './achivementsIcon';
import { AllIsMineAchieve } from './i/allIsMine';
import { BroccoliAgainAchieve } from './i/broccoliAgain';
import { ExplorerAchieve } from './i/explorer';
import { ScoreThousand } from './i/scoreThousand';
import { ScoreThousandForAll } from './i/scoreThousandForAll';

type AchievementType = 'finished' | 'score' | 'no bug' | 'win' | 'ate bug' | 'started';

class AchievePlug  extends Achievement {
  name = '1000 for all' as const;
  progressComplete = 6;
  progress = {
    all: assets.labyrinth.length,
    now: 0
  };
  accept(_type: AchievementType, _game: any) {
  }

  static create(name: string) {
    const a = new AchievePlug();
    a.name = name as any;
    return a;
  }
}

class Achievements
{
  achievements: Achievement[] = [];
  resurrected: Achievement[] = [];

  onAchieved?: (a: Achievement) => void;

  accept(eventType: AchievementType, context: Stamp)
  {
    if (context.retryCounter === 0) {
      for (const achievement of this.achievements) {
        achievement.accept(eventType, context);
      }
    }
    for (const achievement of this.resurrected) {
      achievement.accept(eventType, context);
    }
  }

  *results() {
    for (let i = 0; i < this.achievements.length; ++i) {
      if (this.achievements[i].isFinished) {
        yield this.achievements[i];
      } else {
        yield this.resurrected[i];
      }
    }
  }

  constructor() {
    for (const achievements of [this.achievements, this.resurrected]) {
      achievements.push(new ScoreThousand());
      achievements.push(new ScoreThousandForAll());
      achievements.push(new ExplorerAchieve());
      achievements.push(new AllIsMineAchieve());
      achievements.push(new BroccoliAgainAchieve());
      for (const [key] of Object.entries(ICONS)) {
        if (achievements.find(n => n.name === key) === undefined) {
          achievements.push(AchievePlug.create(key));
        }
      }
    }
    for (const achievement of this.resurrected) {
      achievement.isResurrected = true;
    }
  }

  /**
   * Пакетная переигровка stamp'ов без попапов onAchieved
   * (история с диска / с сервера — не «новые» ачивки в этой сессии).
   */
  acceptFinishedHistory(stamps: Stamp[]): void {
    const prev = this.onAchieved;
    this.onAchieved = undefined;
    try {
      for (const stamp of stamps) {
        if (stamp) this.accept('finished', stamp);
      }
    } finally {
      this.onAchieved = prev;
    }
  }

  /** Переигровка stamp'ов из localStorage — только после mount (не в constructor). */
  hydrateFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = JSON.parse(localStorage.getItem('stamp') ?? '[]');
      if (!Array.isArray(raw)) return;
      const stamps: Stamp[] = [];
      for (const item of raw) {
        const stamp = item && typeof item === 'object' && 'stamp' in item
          ? (item as { stamp: Stamp }).stamp
          : (item as Stamp);
        if (stamp) stamps.push(stamp);
      }
      this.acceptFinishedHistory(stamps);
    } catch {
      /* ignore broken storage */
    }
  }
}

var achievements = new Achievements();

export { achievements };

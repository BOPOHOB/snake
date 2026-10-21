import { assets } from '../../components/game/assets';
import { Achievement } from './achivement';
import { ICONS } from './achivementsIcon';
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

  accept(eventType: AchievementType, context: any)
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
      for (const [key] of Object.entries(ICONS)) {
        achievements.push(AchievePlug.create(key));
      }
    }
    for (const achievement of this.resurrected) {
      achievement.isResurrected = true;
    }
    if (typeof localStorage !== 'undefined') {
      for (const stamp of JSON.parse(localStorage.getItem('stamp') ?? '[]')) {
        this.accept('finished', stamp);
      }
    }
  }
}

var achievements = new Achievements();

export { achievements };

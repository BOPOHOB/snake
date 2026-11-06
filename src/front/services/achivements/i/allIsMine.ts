import { Achievement, type AchievementType } from '../achivement';
import { bugIter, type Stamp } from '../../../types/stamp';

class AllIsMineAchieve extends Achievement {
  name = 'All is mine' as const;

  progress = {
    all: 5,
    now: 0,
  };
  
  accept(type: AchievementType, stamp: Pick<Stamp, 'bugTicks' | 'bugEaten' | 'bugTypes'>) {
    if (stamp.bugEaten.length < this.progress.all) {
      return;
    }
    const ticks = stamp.bugTicks;
    const eaten = stamp.bugEaten;
    switch (type) {
    case 'finished':
      let inARow = 0;
      for (const bug of bugIter(stamp)) {
        if (bug.eatenTick !== null) {
          inARow += 1;
          this.progress.now = Math.max(this.progress.now, inARow);
          if (inARow === this.progress.all) {
            this.finish();
            return;
          }
        } else {
          inARow = 0;
        }
      }
      return;
    case 'ate bug':
      let i = 0;
      while (i < this.progress.all && i < eaten.length) {
        if (ticks.at(-1 - i)! > eaten.at(-1 - i)!) {
          console.log('gg', ticks.at(-1 - i), eaten.at(-1 - i));
          this.progress.now = i;
          return;
        }
        ++i;
      }
      console.log('kk', i);
      this.progress.now = i;
      if (this.progress.all === this.progress.now) {
        this.finish();
      }
      return;
    default:
      return;
    }
  }
}

export { AllIsMineAchieve };

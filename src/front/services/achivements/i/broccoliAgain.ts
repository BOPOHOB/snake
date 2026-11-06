import { Achievement, type AchievementType } from '../achivement';
import { bugIter, type Stamp } from '../../../types/stamp';

class BroccoliAgainAchieve extends Achievement {
  name = 'Broccoli again' as const;

  progress = {
    all: 3,
    now: 0,
  };
  
  accept(type: AchievementType, stamp: Pick<Stamp, 'bugTicks' | 'bugEaten' | 'bugTypes'>) {
    switch (type) {
    case 'finished':
      //@todo добавить оптимизированный вариант для просмотра хвоста массива при съедении
    case 'ate bug':
      let strick = 0;
      let curType: null | number = null
      for (const bug of bugIter(stamp)) {
        if (bug.eatenTick !== null) {
          if (bug.type === curType) {
            strick += 1;
            this.progress.now = Math.max(this.progress.now, strick);
            if (strick === this.progress.all) {
              this.progress.now = this.progress.all;
              this.finish();
              return;
            }
          } else {
            strick = 1;
            curType = bug.type;
          }
        }
      }
      return;
    default:
      return;
    }
  }
}

export { BroccoliAgainAchieve };

import { Achievement, type AchievementType } from '../achivement';
import { assets } from '../../../components/game/assets';

class ExplorerAchieve extends Achievement {
  name = 'Explorer' as const;

  progress = {
    all: assets.labyrinth.length,
    now: 0,
  };

  state: Array<boolean> = new Array(assets.labyrinth.length).fill(false);
  
  accept(type: AchievementType, game: any) {
    switch (type) {
    case 'finished':
    case 'started':
      this.state[game.stamp.labyrinth] = true;
      this.progress.now = this.state.reduce((sum: number, cur: boolean) => sum + Number(cur), 0);
      if (this.state.indexOf(false) < 0) {
        this.finish();
      }
      return;
    default:
      return;
    }
  }
}

export { ExplorerAchieve };

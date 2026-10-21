import { assets } from "../../../components/game/assets";
import { Achievement, type AchievementType } from "../achivement";


class ScoreThousandForAll extends Achievement {
  name = '1000 for all' as const;
  progressComplete = 6;
  progress = {
    all: assets.labyrinth.length,
    now: 0
  };

  state: Array<boolean> = new Array(assets.labyrinth.length).fill(false);

  accept(type: AchievementType, game: any) {
    switch (type) {
    case 'finished':
    case 'score':
      if (game.stamp.score >= 1000) {
        this.state[game.stamp.labyrinth] = true;
        this.progress.now = this.state.reduce((sum, cur) => cur ? sum + 1 : sum, 0);
        if (this.state.indexOf(false) < 0) {
          this.finish();
        }
      }
      return;
    default:
      return;
    }
  }
}

export { ScoreThousandForAll };

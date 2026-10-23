import type { Stamp } from "../../../types/stamp";
import { Achievement, type AchievementType } from "../achivement";

class ScoreThousand extends Achievement {
  name = 'Not a beginner' as const;
  progress = {
    all: 1000,
    now: 0
  };
  
  accept(type: AchievementType, game: Stamp) {
    switch (type) {
    case 'finished':
    case 'score':
      this.progress.now = Math.max(game.score, this.progress.now);
      if (this.progress.now >= 1000) {
        this.finish();
      }
      return;
    default:
      return;
    }
  }
}

export { ScoreThousand };

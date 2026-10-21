import { Achievement, type AchievementType } from "../achivement";

class ScoreThousand extends Achievement {
  name = 'Not a beginner' as const;
  progress = {
    all: 1000,
    now: 0
  };
  
  accept(type: AchievementType, game: any) {
    switch (type) {
    case 'finished':
    case 'score':
      this.progress.now = Math.max(game.stamp.score, this.progress.now);
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

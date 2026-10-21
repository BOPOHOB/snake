import { Achievement, type AchievementType } from "../achivement";
import { ICONS } from "../achivementsIcon";

class ScoreThousand extends Achievement {
  name = 'Not a beginner' as const;
  details = 'Collect 1000 points in any game';
  
  accept(type: AchievementType, game: any) {
    switch (type) {
    case 'finished':
    case 'score':
      if (game.score >= 1000) {
        this.finish();
      }
      return;
    default:
      return;
    }
  }
}

export { ScoreThousand };

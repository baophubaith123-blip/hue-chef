export interface ScoreInput {
  baseScore: number;
  correctCount: number;
  wrongCount: number;
  timeRemainingSeconds: number;
  totalDurationSeconds: number;
  timedOut: boolean;
  allIngredientsAdded: boolean;
}

export interface ScoreResult {
  totalScore: number;
  stars: 1 | 2 | 3 | 4 | 5;
}

const CORRECT_POINTS = 50;
const WRONG_PENALTY = 20;
const MAX_TIME_BONUS_RATIO = 0.2;

export function calculateScore(input: ScoreInput): number {
  if (input.timedOut || !input.allIngredientsAdded) {
    return 0;
  }

  let total = input.baseScore;
  total += input.correctCount * CORRECT_POINTS;
  total -= input.wrongCount * WRONG_PENALTY;

  if (input.totalDurationSeconds > 0) {
    const timeRatio = Math.min(1, Math.max(0, input.timeRemainingSeconds / input.totalDurationSeconds));
    total += Math.round(input.baseScore * MAX_TIME_BONUS_RATIO * timeRatio);
  }

  return Math.max(0, total);
}

export function calculateStars(score: number, baseScore: number, ingredientCount: number): 1 | 2 | 3 | 4 | 5 {
  const maxScore =
    baseScore +
    ingredientCount * CORRECT_POINTS +
    Math.round(baseScore * MAX_TIME_BONUS_RATIO);

  if (maxScore <= 0) {
    return 1;
  }

  const ratio = score / maxScore;

  if (ratio >= 0.95) {
    return 5;
  }
  if (ratio >= 0.8) {
    return 4;
  }
  if (ratio >= 0.6) {
    return 3;
  }
  if (ratio >= 0.35) {
    return 2;
  }
  return 1;
}

export function calculateScoreResult(input: ScoreInput, ingredientCount: number): ScoreResult {
  const totalScore = calculateScore(input);
  const stars = calculateStars(totalScore, input.baseScore, ingredientCount);
  return { totalScore, stars };
}

export function calculateXpFromStars(stars: 1 | 2 | 3 | 4 | 5): number {
  switch (stars) {
    case 5:
      return 500;
    case 4:
      return 400;
    case 3:
      return 300;
    case 2:
      return 200;
    case 1:
    default:
      return 100;
  }
}

export function calculateLevelProgress(
  currentExp: number,
  currentMaxExp: number,
  gainedXp: number,
): { level: number; exp: number; maxExp: number; leveledUp: boolean; gainedLevels: number } {
  const initialLevel =
    currentMaxExp < 1000 ? 1 : 1 + Math.round((currentMaxExp - 1000) / 500);
  let level = Math.max(1, initialLevel);
  let exp = currentExp + gainedXp;
  let maxExp = currentMaxExp;
  let leveledUp = false;
  let gainedLevels = 0;

  while (exp >= maxExp && maxExp > 0) {
    exp -= maxExp;
    level += 1;
    gainedLevels += 1;
    maxExp = 1000 + (level - 1) * 500;
    leveledUp = true;
  }

  return { level, exp, maxExp, leveledUp, gainedLevels };
}

export const SCORE_RULES = {
  correctPoints: CORRECT_POINTS,
  wrongPenalty: WRONG_PENALTY,
} as const;

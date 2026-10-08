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

export const SCORE_RULES = {
  correctPoints: CORRECT_POINTS,
  wrongPenalty: WRONG_PENALTY,
} as const;

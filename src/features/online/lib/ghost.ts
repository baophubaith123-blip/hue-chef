import type { GhostRun } from '@/features/online/types';

/**
 * Ghost replay maths (Gói H9, ý tưởng 8): a recorded run is replayed
 * against the answerer in real time — its score unfolds stage by
 * stage, linearly inside the stage currently running. Stage scores
 * are recorded on the run's own partial scales, so the replay is
 * rescaled once (totalScore / sum of stage scores) and the final
 * replayed point total lands EXACTLY on ghost.totalScore.
 */

export function ghostProgressAt(
  ghost: GhostRun,
  elapsedMs: number,
): { score: number; stageKey: string | null; finished: boolean } {
  const stages = ghost.stages;
  const finished = elapsedMs >= ghost.durationMs;
  if (stages.length === 0) {
    return { score: finished ? ghost.totalScore : 0, stageKey: null, finished };
  }
  const rawTotal = stages.reduce((sum, stage) => sum + Math.max(0, stage.score), 0);
  const scale = rawTotal > 0 ? ghost.totalScore / rawTotal : 0;
  const elapsed = Math.max(0, elapsedMs);

  const last = stages[stages.length - 1];
  if (!last) return { score: 0, stageKey: null, finished };
  if (elapsed >= last.atMs) {
    // Every stage has completed: the replay sits on the final total
    // (exactly totalScore by construction) until the clock runs out.
    return { score: ghost.totalScore, stageKey: last.key, finished };
  }

  let banked = 0;
  let prevAt = 0;
  for (const stage of stages) {
    if (elapsed < stage.atMs) {
      const span = stage.atMs - prevAt;
      const ratio = span > 0 ? (elapsed - prevAt) / span : 1;
      const raw = banked + Math.max(0, stage.score) * Math.min(1, Math.max(0, ratio));
      return { score: Math.round(raw * scale), stageKey: stage.key, finished };
    }
    banked += Math.max(0, stage.score);
    prevAt = stage.atMs;
  }
  return { score: ghost.totalScore, stageKey: last.key, finished };
}

/** The winner of a finished duel, or null on a draw. */
export function decideWinner(
  challengerScore: number,
  opponentScore: number,
  challengerId: string,
  opponentId: string,
): string | null {
  if (challengerScore === opponentScore) return null;
  return challengerScore > opponentScore ? challengerId : opponentId;
}

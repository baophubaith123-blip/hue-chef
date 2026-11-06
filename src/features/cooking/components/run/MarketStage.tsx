import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getIngredientById, SEED_INGREDIENTS } from '@/data/ingredients';
import type { Recipe } from '@/data/types';
import type { ResolvedStageConfig } from '@/features/cooking/lib/stage-config';
import { clampRatio, marketRawMax } from '@/features/cooking/lib/score-rescale';
import {
  MARKET_FULL_LIST_BONUS,
  MARKET_PICK_POINTS,
  MARKET_WRONG_PENALTY,
} from '@/features/cooking/lib/stage-bonus';
import { shuffleArray } from '@/features/cooking/lib/shuffle';
import { StageHelp } from '@/features/cooking/components/run/StageHelp';
import { useTranslation } from '@/i18n/useTranslation';
import { playSound } from '@/lib/sound';

import styles from '@/features/cooking/components/run/MarketStage.module.css';

interface MarketStageProps {
  recipe: Recipe;
  config: ResolvedStageConfig;
  /** This stage's share of the dish's value (the score ceiling split). */
  maxPoints: number;
  onProgress?: (points: number) => void;
  onComplete: (bonus: number) => void;
}

type ListState = 'viewing' | 'hidden' | 'peeking';

/**
 * Stage ① — Đi chợ: memorise the shopping list, then pick the dish's
 * ingredients at a shuffled stall. From 3★ the list hides itself when the
 * viewing time ends; peeking again costs 5s and every hide reshuffles the
 * stall so positions cannot be memorised.
 */
export function MarketStage({ recipe, config, maxPoints, onProgress, onComplete }: MarketStageProps) {
  const { dict } = useTranslation();
  const s = dict.cooking.stages;
  const hidesList = config.marketViewSeconds > 0;

  const correctIds = useMemo(
    () => Array.from(new Set(recipe.ingredients.map((ref) => ref.ingredientId))),
    [recipe],
  );
  const correctSet = useMemo(() => new Set(correctIds), [correctIds]);
  const amountById = useMemo(() => {
    const map = new Map<string, string>();
    for (const ref of recipe.ingredients) map.set(ref.ingredientId, ref.amount);
    return map;
  }, [recipe]);

  const [stallIds, setStallIds] = useState<string[]>(() => {
    const pool = SEED_INGREDIENTS.filter((item) => !correctSet.has(item.id));
    const decoys = shuffleArray(pool)
      .slice(0, config.marketDecoyCount)
      .map((item) => item.id);
    return shuffleArray([...correctIds, ...decoys]);
  });
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [wrong, setWrong] = useState<ReadonlySet<string>>(new Set());
  const [bonus, setBonus] = useState(0);
  const [listState, setListState] = useState<ListState>('viewing');
  const [secondsLeft, setSecondsLeft] = useState(config.marketSeconds);
  const [phaseSeconds, setPhaseSeconds] = useState(config.marketViewSeconds);
  const [toast, setToast] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);

  const doneRef = useRef(false);
  const bonusRef = useRef(0);
  const timeRef = useRef(config.marketSeconds);
  const listStateRef = useRef<ListState>('viewing');
  const phaseRef = useRef(config.marketViewSeconds);
  const pausedRef = useRef(false);
  const toastTimerRef = useRef<number | null>(null);

  // Raw stage points are converted into this stage's share of the dish's
  // value, so the run total can never pass the recipe's baseScore.
  const rawMax = marketRawMax(correctIds.length);
  const toRescaled = useCallback(
    (raw: number) =>
      Math.max(0, Math.min(maxPoints, Math.round(maxPoints * clampRatio(raw / rawMax)))),
    [maxPoints, rawMax],
  );

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete(toRescaled(bonusRef.current));
  }, [onComplete, toRescaled]);

  useEffect(() => {
    onProgress?.(toRescaled(bonus));
  }, [bonus, onProgress, toRescaled]);

  const hideList = useCallback(() => {
    listStateRef.current = 'hidden';
    setListState('hidden');
    // Every hide reshuffles the stall: positions cannot be memorised.
    setStallIds((prev) => shuffleArray(prev));
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (pausedRef.current || doneRef.current) return;
      timeRef.current = Math.max(0, timeRef.current - 0.2);
      setSecondsLeft(timeRef.current);
      if (hidesList && listStateRef.current !== 'hidden') {
        phaseRef.current = Math.max(0, phaseRef.current - 0.2);
        setPhaseSeconds(phaseRef.current);
        if (phaseRef.current <= 0) {
          hideList();
        }
      }
      if (timeRef.current <= 0) {
        finish();
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [finish, hideList, hidesList]);

  const handlePeek = useCallback(() => {
    if (listStateRef.current !== 'hidden' || doneRef.current) return;
    timeRef.current = Math.max(0, timeRef.current - config.marketPeekCostSeconds);
    setSecondsLeft(timeRef.current);
    if (timeRef.current <= 0) {
      finish();
      return;
    }
    phaseRef.current = config.marketPeekShowSeconds;
    setPhaseSeconds(config.marketPeekShowSeconds);
    listStateRef.current = 'peeking';
    setListState('peeking');
  }, [config.marketPeekCostSeconds, config.marketPeekShowSeconds, finish]);

  const handlePick = useCallback(
    (ingredientId: string) => {
      if (doneRef.current || pausedRef.current) return;
      if (picked.has(ingredientId) || wrong.has(ingredientId)) return;
      if (correctSet.has(ingredientId)) {
        const nextPicked = new Set(picked);
        nextPicked.add(ingredientId);
        setPicked(nextPicked);
        bonusRef.current += MARKET_PICK_POINTS;
        playSound('drop');
        if (nextPicked.size === correctIds.length) {
          bonusRef.current += MARKET_FULL_LIST_BONUS;
          showToast(
            s.marketFullList(
              Math.round((maxPoints * MARKET_FULL_LIST_BONUS) / Math.max(1, rawMax)),
            ),
          );
          playSound('success');
        }
        setBonus(bonusRef.current);
      } else {
        const nextWrong = new Set(wrong);
        nextWrong.add(ingredientId);
        setWrong(nextWrong);
        bonusRef.current -= MARKET_WRONG_PENALTY;
        setBonus(bonusRef.current);
        showToast(s.marketWrongToast);
        playSound('error');
      }
    },
    [correctIds.length, correctSet, maxPoints, picked, rawMax, s, showToast, wrong],
  );

  const listVisible = listState !== 'hidden';
  const secondsDisplay = Math.ceil(secondsLeft);
  const phaseDisplay = Math.ceil(phaseSeconds);

  return (
    <section className={styles.stage} aria-label={s.marketName}>
      <div className={styles.topBar}>
        <span className={styles.stageChip}>🧺 ① {s.marketName}</span>
        <span className={styles.chip}>{s.marketCollected(picked.size, correctIds.length)}</span>
        <span className={styles.chip}>⭐ +{toRescaled(bonus)}</span>
        <span
          className={[styles.chip, secondsDisplay <= 10 ? styles.chipDanger : '']
            .filter(Boolean)
            .join(' ')}
        >
          ⏱ {s.marketTimeLeft(secondsDisplay)}
        </span>
      </div>

      {listVisible ? (
        <div className={styles.listPanel}>
          <div className={styles.listHead}>
            <span className={styles.listTitle}>📋 {s.marketListTitle}</span>
            {hidesList ? (
              <span className={styles.viewChip}>
                ⏳{' '}
                {listState === 'peeking'
                  ? s.marketPeekShowing(phaseDisplay)
                  : s.marketViewLeft(phaseDisplay)}
              </span>
            ) : null}
          </div>
          <div className={styles.listItems}>
            {correctIds.map((id) => {
              const ing = getIngredientById(id);
              const got = picked.has(id);
              return (
                <span key={id} className={got ? styles.listItemGot : styles.listItem}>
                  {ing?.fallbackEmoji} {ing?.name ?? id}
                  <small>{amountById.get(id)}</small>
                  {got ? ' ✓' : ''}
                </span>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={styles.listHiddenPanel}>
          <span className={styles.hiddenEmoji}>🙈</span>
          <span>{s.marketListHidden}</span>
        </div>
      )}

      <div className={styles.stall}>
        {stallIds.map((id) => {
          const ing = getIngredientById(id);
          const isPicked = picked.has(id);
          const isWrong = wrong.has(id);
          return (
            <button
              key={id}
              type="button"
              className={[
                styles.item,
                isPicked ? styles.itemPicked : '',
                isWrong ? styles.itemWrong : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handlePick(id)}
              disabled={isPicked || isWrong}
            >
              <span className={styles.itemEmoji}>{ing?.fallbackEmoji ?? '❔'}</span>
              <span className={styles.itemName}>{ing?.name ?? id}</span>
              <small className={styles.itemSub}>
                {isPicked ? `✓ ${amountById.get(id) ?? ''}` : isWrong ? '✗' : ' '}
              </small>
            </button>
          );
        })}
      </div>

      {toast ? <div className={styles.toast}>{toast}</div> : null}

      <div className={styles.footer}>
        {hidesList && listState === 'hidden' ? (
          <button type="button" className={styles.peekBtn} onClick={handlePeek}>
            👀 {s.marketPeek}
          </button>
        ) : null}
        <button type="button" className={styles.goBtn} onClick={finish}>
          🛒 {s.marketGo} ➜
        </button>
      </div>

      <StageHelp
        stageName={s.marketName}
        rules={[s.marketRule1, s.marketRule2, s.marketRule3, s.marketRule4]}
        onOpenChange={setPaused}
      />
    </section>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getIngredientById, SEED_INGREDIENTS } from '@/data/ingredients';
import type { Recipe } from '@/data/types';
import type { ResolvedStageConfig } from '@/features/cooking/lib/stage-config';
import { clampRatio, marketRawMax } from '@/features/cooking/lib/score-rescale';
import {
  MARKET_FULL_LIST_BONUS,
  MARKET_MAX_STRIKES,
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
  /** Called when the run fails at this stage (3 strikes at 0 points). */
  onFail: () => void;
}

type ListState = 'viewing' | 'hidden' | 'peeking';

/**
 * Stage ① — Đi chợ: two clear phases at every difficulty. MEMORISE: only
 * the shopping list and its countdown are on screen — no stalls yet.
 * Tapping "Lên Xe" or letting the viewing time end hides the list and
 * starts the PICK phase, where the stalls appear and the market clock
 * runs. Peeking again costs 5s and every hide reshuffles the stall so
 * positions cannot be memorised.
 */
export function MarketStage({ recipe, config, maxPoints, onProgress, onComplete, onFail }: MarketStageProps) {
  const { dict } = useTranslation();
  const s = dict.cooking.stages;

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
  const [stallPage, setStallPage] = useState(0);
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [wrong, setWrong] = useState<ReadonlySet<string>>(new Set());
  const [bonus, setBonus] = useState(0);
  const [listState, setListState] = useState<ListState>('viewing');
  const [secondsLeft, setSecondsLeft] = useState(config.marketSeconds);
  const [phaseSeconds, setPhaseSeconds] = useState(config.marketViewSeconds);
  const [toast, setToast] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [strikes, setStrikes] = useState(0);
  const [failed, setFailed] = useState(false);
  const [failSecondsLeft, setFailSecondsLeft] = useState(3);

  const doneRef = useRef(false);
  const bonusRef = useRef(0);
  const timeRef = useRef(config.marketSeconds);
  const listStateRef = useRef<ListState>('viewing');
  const phaseRef = useRef(config.marketViewSeconds);
  const pausedRef = useRef(false);
  const toastTimerRef = useRef<number | null>(null);
  const strikesRef = useRef(0);
  const exitedRef = useRef(false);

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
      if (listStateRef.current === 'viewing') {
        // MEMORISE phase: only the viewing clock runs; the market clock
        // starts together with the PICK phase.
        phaseRef.current = Math.max(0, phaseRef.current - 0.2);
        setPhaseSeconds(phaseRef.current);
        if (phaseRef.current <= 0) {
          hideList();
        }
        return;
      }
      timeRef.current = Math.max(0, timeRef.current - 0.2);
      setSecondsLeft(timeRef.current);
      if (listStateRef.current === 'peeking') {
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
  }, [finish, hideList]);

  const exitToRecipe = useCallback(() => {
    if (exitedRef.current) return;
    exitedRef.current = true;
    onFail();
  }, [onFail]);

  const triggerFail = useCallback(() => {
    // The run ends here: freeze the stage clocks and picks, then show the
    // fail overlay (button + 3s auto-return handled by the effect below).
    doneRef.current = true;
    setFailed(true);
    setFailSecondsLeft(3);
    playSound('error');
  }, []);

  useEffect(() => {
    if (!failed) return undefined;
    const timer = window.setInterval(() => {
      setFailSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          exitToRecipe();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [failed, exitToRecipe]);

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
      if (listStateRef.current === 'viewing') return;
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
        if (bonusRef.current > 0) {
          // Points on the board: deduct (never below 0), no strike.
          bonusRef.current = Math.max(0, bonusRef.current - MARKET_WRONG_PENALTY);
          setBonus(bonusRef.current);
          showToast(s.marketWrongToast);
        } else {
          // At 0 points there is nothing to deduct: the wrong pick counts
          // as a strike instead. Strikes never reset mid-stage, and the
          // third one fails the whole run.
          const nextStrikes = strikesRef.current + 1;
          strikesRef.current = nextStrikes;
          setStrikes(nextStrikes);
          if (nextStrikes >= MARKET_MAX_STRIKES) {
            triggerFail();
          } else {
            showToast(s.marketStrikeToast(nextStrikes));
          }
        }
        playSound('error');
      }
    },
    [correctIds.length, correctSet, maxPoints, picked, rawMax, s, showToast, triggerFail, wrong],
  );

  // Stall paging (presentation only): 8 stalls per page, picks persist
  // across pages and reshuffles redistribute over all pages.
  const STALL_PAGE_SIZE = 8;
  const stallPageCount = Math.max(1, Math.ceil(stallIds.length / STALL_PAGE_SIZE));
  const safeStallPage = Math.min(stallPage, stallPageCount - 1);
  const visibleStallIds = stallIds.slice(
    safeStallPage * STALL_PAGE_SIZE,
    safeStallPage * STALL_PAGE_SIZE + STALL_PAGE_SIZE,
  );

  // "Lên Xe" during MEMORISE ends the memorising early and opens the
  // stalls; during PICK it ends the stage as before.
  const handleGo = listState === 'viewing' ? hideList : finish;

  const listVisible = listState !== 'hidden';
  const secondsDisplay = Math.ceil(secondsLeft);
  const phaseDisplay = Math.ceil(phaseSeconds);

  const listPanel = (
    <div className={styles.listPanel}>
      <div className={styles.listHead}>
        <span className={styles.listTitle}>📋 {s.marketListTitle}</span>
        <span className={styles.viewChip}>
          ⏳{' '}
          {listState === 'peeking'
            ? s.marketPeekShowing(phaseDisplay)
            : s.marketViewLeft(phaseDisplay)}
        </span>
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
  );

  return (
    <section className={styles.stage} aria-label={s.marketName}>
      <div className={styles.topBar}>
        <span className={styles.stageChip}>🧺 ① {s.marketName}</span>
        <span className={styles.chip}>{s.marketCollected(picked.size, correctIds.length)}</span>
        <span className={styles.chip}>⭐ +{toRescaled(bonus)}</span>
        <span
          className={[styles.chip, strikes > 0 ? styles.chipWarn : '']
            .filter(Boolean)
            .join(' ')}
        >
          ⚠ {s.marketStrikes(strikes, MARKET_MAX_STRIKES)}
        </span>
        <span
          className={[styles.chip, secondsDisplay <= 10 ? styles.chipDanger : '']
            .filter(Boolean)
            .join(' ')}
        >
          ⏱ {s.marketTimeLeft(secondsDisplay)}
        </span>
      </div>

      {listState === 'viewing' ? (
        <div className={styles.memorizeWrap}>{listPanel}</div>
      ) : listVisible ? (
        listPanel
      ) : (
        <div className={styles.listHiddenPanel}>
          <span className={styles.hiddenEmoji}>🙈</span>
          <span>{s.marketListHidden}</span>
        </div>
      )}

      {listState !== 'viewing' ? (
        <>

      <div className={styles.stall}>
        {visibleStallIds.map((id) => {
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

      {stallPageCount > 1 ? (
        <div className={styles.pager}>
          <button
            type="button"
            className={styles.pagerBtn}
            aria-label={s.pagerPrev}
            disabled={safeStallPage === 0}
            onClick={() => setStallPage(safeStallPage - 1)}
          >
            ◀
          </button>
          <div className={styles.pagerCenter}>
            <span className={styles.pagerSign}>
              🪧 {s.marketStallPage(safeStallPage + 1, stallPageCount)}
            </span>
            <span className={styles.pagerDots}>
              {Array.from({ length: stallPageCount }, (_, i) => (
                <span
                  key={i}
                  className={i === safeStallPage ? styles.pagerDotActive : styles.pagerDot}
                />
              ))}
            </span>
          </div>
          <button
            type="button"
            className={styles.pagerBtn}
            aria-label={s.pagerNext}
            disabled={safeStallPage >= stallPageCount - 1}
            onClick={() => setStallPage(safeStallPage + 1)}
          >
            ▶
          </button>
        </div>
      ) : null}
        </>
      ) : null}

      {toast ? <div className={styles.toast}>{toast}</div> : null}

      <div className={styles.footer}>
        {listState === 'hidden' ? (
          <button type="button" className={styles.peekBtn} onClick={handlePeek}>
            👀 {s.marketPeek}
          </button>
        ) : null}
        <button type="button" className={styles.goBtn} onClick={handleGo}>
          🛒 {s.marketGo} ➜
        </button>
      </div>

      {failed ? (
        <div className={styles.failOverlay} role="alertdialog" aria-label={s.marketFailTitle}>
          <div className={styles.failCard}>
            <span className={styles.failEmoji}>💥</span>
            <h3 className={styles.failTitle}>{s.marketFailTitle}</h3>
            <p className={styles.failReason}>{s.marketFailReason}</p>
            <button type="button" className={styles.failBtn} onClick={exitToRecipe}>
              🛒 {s.marketFailBack}
            </button>
            <span className={styles.failAuto}>{s.marketFailAuto(failSecondsLeft)}</span>
          </div>
        </div>
      ) : null}

      <StageHelp
        stageName={s.marketName}
        rules={[s.marketRule1, s.marketRule2, s.marketRule3, s.marketRule4]}
        onOpenChange={setPaused}
      />
    </section>
  );
}

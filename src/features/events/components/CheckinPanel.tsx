import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Badge } from '@/components/theme-d/Badge';
import { dishArtClearFor } from '@/components/theme-d/dish-art';
import { GoldButton } from '@/components/theme-d/GoldButton';
import { Toast, type ToastTone } from '@/components/theme-d/Toast';
import { WoodPanel } from '@/components/theme-d/WoodPanel';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import {
  CHECKIN_REWARDS,
  currentStreak,
  dishOfDayId,
  nextCycleDay,
} from '@/features/events/lib/checkin';
import { claimCheckin, useEvents } from '@/features/events/store';
import { dishGradeFor } from '@/features/recipes/lib/grade';
import { addDays, dayDiff, todayKey } from '@/features/stall/lib/day';
import { useTranslation } from '@/i18n/useTranslation';
import { celebrate } from '@/lib/juice';
import { playSound } from '@/lib/sound';

import styles from '@/features/events/components/CheckinPanel.module.css';

import dailyPedestal from '@/assets/theme-d/game/r4-home-daily.webp';

/**
 * Check-in panel (Gói H7, ý tưởng 20): the 7-day claim cycle, the live
 * cooking streak and the dish of the day, in one Án A hanging wood
 * panel (sign = the check-in title); the dish of the day is a nested
 * WoodPanel of its own. Rendered on the quests page and on the player
 * home page (narrow column — the sign shrinks with the panel width).
 * Rewards come back from the events store and are booked through
 * AuthContext, keeping the wallet's single-writer law intact.
 */
export function CheckinPanel() {
  const { dict } = useTranslation();
  const { user, addCoins, addCok } = useAuth();
  const events = useEvents(user?.id ?? null);
  const { getRecipeById } = useRecipes();

  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (message: string, tone: ToastTone) => {
    setToast({ message, tone });
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4200);
  };

  if (!user || !events) return null;

  const c = dict.events.checkin;
  const { checkin, streak } = events;

  const today = todayKey();
  const yesterday = addDays(today, -1);
  const claimedToday = checkin.lastClaimDay === today;
  const targetDay = claimedToday
    ? checkin.cycleDay
    : nextCycleDay(checkin.lastClaimDay, checkin.cycleDay, today);

  // A past day cell counts as claimed when the claim chain reaching it
  // is still alive: either today is already claimed (the cycle includes
  // today), or yesterday was claimed and the cycle has not wrapped yet.
  const isDayClaimed = (day: number): boolean => {
    if (claimedToday) return day <= checkin.cycleDay;
    return checkin.lastClaimDay === yesterday && checkin.cycleDay < 7 && day <= checkin.cycleDay;
  };

  const broken =
    checkin.lastClaimDay !== '' && dayDiff(checkin.lastClaimDay, today) > 1 && !claimedToday;

  const streakNow = currentStreak(streak.count, streak.lastPlayDay, today);

  const dotdId = dishOfDayId(today);
  const dotdRecipe = getRecipeById(dotdId);
  const dotdGrade = dotdRecipe ? dishGradeFor(dotdRecipe) : null;
  const dotdGradeLabel = dotdGrade ? (dict.recipe.gradeNames[dotdGrade - 1] ?? '') : '';

  const handleClaim = () => {
    const result = claimCheckin(user.id);
    if (!result) return;
    if (result.xu > 0) addCoins(result.xu);
    if (result.cok > 0) addCok(result.cok);
    // Gói H8: a claimed day chimes and bursts.
    playSound('checkin');
    if (result.cok > 0) playSound('cok');
    celebrate('small');
    showToast(c.claimedToast(result.cycleDay, result.xu, result.cok), 'success');
  };

  return (
    <WoodPanel title={c.title} titleLevel="h2" className={styles.panel} bodyClassName={styles.panelBody}>
      <div className={styles.head}>
        <div className={styles.headText}>
          <p className={styles.subtitle}>{c.subtitle}</p>
        </div>
        <div className={styles.streakBox}>
          {streakNow > 0 ? (
            <span className={styles.streakLive}>
              <span aria-hidden="true">🔥</span> {c.streakLabel(streakNow)}
            </span>
          ) : (
            <span className={styles.streakNone}>{c.streakNone}</span>
          )}
          {streak.best > 1 ? <span className={styles.streakBest}>{c.streakBest(streak.best)}</span> : null}
        </div>
      </div>

      <div className={styles.days} role="list" aria-label={c.title}>
        {Array.from({ length: 7 }, (_, index) => {
          const day = index + 1;
          const claimed = isDayClaimed(day);
          const isToday = !claimedToday && day === targetDay;
          const reward = CHECKIN_REWARDS[day - 1];
          const cellClass = [
            styles.dayCell,
            day === 7 ? styles.dayFinal : '',
            claimed ? styles.dayClaimed : '',
            isToday ? styles.dayToday : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <div key={day} className={cellClass} role="listitem">
              <span className={styles.dayLabel}>{c.dayLabel(day)}</span>
              <span className={styles.dayReward}>
                {day < 7 ? (
                  `${reward?.xu ?? 0} ${dict.events.xuUnit}`
                ) : (
                  <>
                    {/* Day 7 pays xu AND cok: the old single-string note
                        (c.day7Note) repeated the day label and overflowed
                        the narrow cell, so the reward renders as two
                        stacked lines built from the same reward data. */}
                    <span className={styles.dayRewardLine}>
                      {`${reward?.xu ?? 0} ${dict.events.xuUnit}`}
                    </span>
                    <span className={styles.dayRewardLine}>
                      {`+ ${reward?.cok ?? 0} ${dict.events.cokUnit}`}
                    </span>
                  </>
                )}
              </span>
              {isToday ? <Badge tone="gold">{c.todayBadge}</Badge> : null}
              {claimed ? (
                <span className={styles.dayCheck} aria-hidden="true">
                  ✓
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      {broken ? <p className={styles.brokenNote}>{c.brokenNote}</p> : null}

      <div className={styles.claimRow}>
        {claimedToday ? (
          <GoldButton disabled>{c.claimedToday}</GoldButton>
        ) : (
          <GoldButton onClick={handleClaim}>{c.claimToday}</GoldButton>
        )}
      </div>

      {dotdRecipe && dotdGrade ? (
        <section className={styles.dotd}>
          {/* Đợt lan 4: dish of the day stands on the golden awning
              pedestal (r4-home-daily) — the real dish art replaces the
              pedestal's painted bowl, the dish name is written on the
              pedestal's front face, and the ×2 tag hangs at its side
              (the data badge beside it carries the same ×2 rule). */}
          <div className={styles.dotdStage}>
            <img className={styles.dotdPedestal} src={dailyPedestal} alt="" aria-hidden="true" />
            {/* The transparent-keyed dish sits INTO the pedestal: centred
                on the counter top where the painted bowl rests, no square
                block, no frame. The grade rides as a small seal at the
                dish's top-right; the name is carved on the pedestal's
                front plaque below — never captioned under the picture. */}
            <ImageWithFallback
              src={dishArtClearFor(dotdRecipe)}
              alt={dotdRecipe.name}
              fallbackTitle={dotdRecipe.name}
              className={styles.dotdDish}
            />
            <span className={styles.dotdGradeSeal}>{dotdGradeLabel}</span>
            <p className={styles.dotdName}>{dotdRecipe.name}</p>
          </div>
          <div className={styles.dotdBody}>
            <h3 className={styles.dotdTitle}>{c.dotdTitle}</h3>
            <div className={styles.dotdHead}>
              <Badge tone="brick">{c.dotdBadge}</Badge>
            </div>
            <p className={styles.dotdNote}>{c.dotdLearnNote}</p>
            <p className={styles.dotdNote}>{c.dotdSellNote}</p>
            <Link to={`/recipes/${dotdId}`} className={styles.dotdLink}>
              {c.dotdCookNow} →
            </Link>
          </div>
        </section>
      ) : null}

      {toast ? (
        <div className={styles.toastBox}>
          <Toast message={toast.message} tone={toast.tone} />
        </div>
      ) : null}
    </WoodPanel>
  );
}

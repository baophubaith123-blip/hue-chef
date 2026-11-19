import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/theme-d/Badge';
import { GoldButton } from '@/components/theme-d/GoldButton';
import { KraftCard } from '@/components/theme-d/KraftCard';
import { Toast, type ToastTone } from '@/components/theme-d/Toast';
import { WoodButton } from '@/components/theme-d/WoodButton';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { getIngredientById } from '@/data/ingredients';
import type { Recipe } from '@/data/types';
import {
  MYSTERY_PREMIUM_PRICE_COK,
  MYSTERY_STANDARD_PRICE_XU,
  buildMysterySwaps,
} from '@/features/events/lib/mystery';
import { registerMysteryBox, useEvents } from '@/features/events/store';
import type { MysteryBox, MysterySwap } from '@/features/events/types';
import { isRecipeOwned } from '@/features/recipes/lib/ownership';
import { todayKey } from '@/features/stall/lib/day';
import { CARD_KINDS } from '@/features/stall/lib/support';
import { useTranslation } from '@/i18n/useTranslation';
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from '@/pages/player/MysteryPage.module.css';

interface MysteryCandidate {
  recipe: Recipe;
  swaps: MysterySwap[];
}

export default function MysteryPage() {
  const { dict } = useTranslation();
  const m = dict.events.mystery;
  const { user, addCoins, addCok } = useAuth();
  const { getApprovedRecipes, getRecipeById } = useRecipes();
  const events = useEvents(user?.id ?? null);
  const navigate = useNavigate();

  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (message: string, tone: ToastTone) => {
    setToast({ message, tone });
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4200);
  };

  if (!events) {
    return (
      <PlayerShell>
        <div className={styles.container} />
      </PlayerShell>
    );
  }

  const today = todayKey();
  const freeAvailable = events.mystery.freeDay !== today;
  const activeBox = events.mystery.activeBox ?? null;
  const activeDish = activeBox ? getRecipeById(activeBox.recipeId) : undefined;

  const openBox = (premium: boolean) => {
    if (!user || activeBox) return;

    const approved = getApprovedRecipes();
    const pool = premium
      ? approved.filter((r) => r.difficulty >= 4)
      : approved.filter((r) => isRecipeOwned(user, r));

    const candidates: MysteryCandidate[] = pool
      .map((recipe) => ({ recipe, swaps: buildMysterySwaps(recipe, premium, Math.random) }))
      .filter(
        (c): c is MysteryCandidate => c.swaps !== null,
      );

    if (candidates.length === 0) {
      showToast(m.noDishNote, 'error');
      return;
    }

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    if (!pick) {
      showToast(m.noDishNote, 'error');
      return;
    }

    if (premium) {
      if ((user.cok ?? 0) < MYSTERY_PREMIUM_PRICE_COK) {
        showToast(m.notEnoughCok, 'error');
        return;
      }
    } else if (!freeAvailable) {
      if ((user.coins ?? 0) < MYSTERY_STANDARD_PRICE_XU) {
        showToast(m.notEnoughXu, 'error');
        return;
      }
    }

    const rewardCard = premium
      ? (CARD_KINDS[Math.floor(Math.random() * CARD_KINDS.length)] ?? null)
      : null;

    const box: MysteryBox = {
      id: `box-${crypto.randomUUID()}`,
      recipeId: pick.recipe.id,
      premium,
      swaps: pick.swaps,
      createdDay: today,
      rewardCard,
    };

    if (premium) {
      addCok(-MYSTERY_PREMIUM_PRICE_COK);
    } else if (!freeAvailable) {
      addCoins(-MYSTERY_STANDARD_PRICE_XU);
    }

    registerMysteryBox(user.id, box, !premium && freeAvailable);
    showToast(m.openToast, 'success');
  };

  return (
    <PlayerShell>
      <div className={styles.container}>
        <div className={styles.head}>
          <h1 className={styles.title}>{m.title}</h1>
          <p className={styles.subtitle}>{m.subtitle}</p>
        </div>

        <p className={styles.intro}>{m.intro}</p>

        <p className={styles.stats}>{m.statsLabel(events.mystery.boxesOpened, events.mystery.bestScore)}</p>

        {activeBox ? (
          <KraftCard as="section" className={styles.activeCard}>
            <div className={styles.activeHead}>
              <h2 className={styles.activeTitle}>{m.activeTitle}</h2>
              {activeBox.premium ? (
                <Badge tone="cok" className={styles.premiumBadge}>
                  {m.premiumBadge}
                </Badge>
              ) : null}
            </div>

            {activeDish ? (
              <div className={styles.dishRow}>
                {activeDish.image ? (
                  <img className={styles.dishImage} src={activeDish.image} alt={activeDish.name} />
                ) : null}
                <div className={styles.dishMeta}>
                  <span className={styles.dishLabel}>{m.dishLabel}</span>
                  <span className={styles.dishName}>
                    🎁 {activeDish.name}
                  </span>
                </div>
              </div>
            ) : (
              <p className={styles.dishName}>🎁 {activeBox.recipeId}</p>
            )}

            <h3 className={styles.swapsTitle}>{m.swapsTitle}</h3>
            <ul className={styles.swapList}>
              {activeBox.swaps.map((swap) => {
                const fromName = getIngredientById(swap.fromId)?.name ?? swap.fromId;
                const toName = getIngredientById(swap.toId)?.name ?? swap.toId;
                return (
                  <li
                    key={`${swap.stepIndex}-${swap.fromId}-${swap.toId}`}
                    className={styles.swapItem}
                  >
                    {m.swapLine(fromName, toName)}
                  </li>
                );
              })}
            </ul>

            {activeBox.premium && activeBox.rewardCard ? (
              <p className={styles.cardLine}>
                {m.cardLine(dict.stall.support.cardNames[activeBox.rewardCard])}
              </p>
            ) : null}

            <GoldButton
              className={styles.cookButton}
              onClick={() => navigate(`/cooking/${activeBox.recipeId}?mystery=${activeBox.id}`)}
            >
              {m.cookNow}
            </GoldButton>

            <p className={styles.boxNote}>{m.boxNote}</p>
          </KraftCard>
        ) : (
          <KraftCard as="section" className={styles.openCard}>
            <div className={styles.openActions}>
              <GoldButton
                className={styles.openButton}
                disabled={!freeAvailable || !user}
                onClick={() => openBox(false)}
              >
                {m.openFree}
              </GoldButton>
              {!freeAvailable ? <p className={styles.freeUsedNote}>{m.freeUsedNote}</p> : null}

              {/* While today's free box is still available it IS the
                  standard open — the paid standard button only appears
                  once the free one is spent, so its price label is
                  never a lie. */}
              {!freeAvailable ? (
                <WoodButton
                  className={styles.openButton}
                  disabled={!user}
                  onClick={() => openBox(false)}
                >
                  {m.openStandard(MYSTERY_STANDARD_PRICE_XU)}
                </WoodButton>
              ) : null}

              <GoldButton
                className={styles.openButton}
                disabled={!user}
                onClick={() => openBox(true)}
              >
                {m.openPremium(MYSTERY_PREMIUM_PRICE_COK)}
              </GoldButton>
              <p className={styles.premiumNote}>{m.premiumNote}</p>
            </div>
          </KraftCard>
        )}

        {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
      </div>
    </PlayerShell>
  );
}

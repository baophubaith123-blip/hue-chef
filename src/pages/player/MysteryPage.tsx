import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/theme-d/Badge';
import { GoldButton } from '@/components/theme-d/GoldButton';
import { Toast, type ToastTone } from '@/components/theme-d/Toast';
import { WoodButton } from '@/components/theme-d/WoodButton';
import { WoodPanel } from '@/components/theme-d/WoodPanel';
import { dishArtFor } from '@/components/theme-d/dish-art';
import { gameIcon } from '@/components/theme-d/game-assets';
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

import eventGate from '@/assets/theme-d/game/r4-event-gate-mystery.webp';
import { playSound } from '@/lib/sound';
import { SceneShell } from '@/pages/player/SceneShell';

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
      <SceneShell>
        <section className={styles.board}>
          <div className={styles.container} />
        </section>
      </SceneShell>
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
    // Gói H8: opening the box gets the chest arp (and a cok sparkle
    // for the premium box).
    playSound('chest');
    if (premium) playSound('cok');
    showToast(m.openToast, 'success');
  };

  return (
    <SceneShell>
      <section className={styles.board}>
        <header className={styles.head}>
          <span className={styles.hangTag}>{dict.nav.mystery}</span>
          <div className={styles.titlePlaque}>
            <h1 className={styles.pageTitle}>{m.title}</h1>
            <p className={styles.pageSub}>{m.subtitle}</p>
          </div>
        </header>

        {/* Đợt lan 4: the festival gate with red curtains (r4-event-gate)
            is the page's stage frame — it sways gently and its chest
            glows; the box panels stand beneath it. */}
        <div className={styles.gateScene}>
          <img className={styles.gateImg} src={eventGate} alt="" aria-hidden="true" />
          <span className={styles.gateGlow} aria-hidden="true" />
        </div>

        <p className={styles.intro}>{m.intro}</p>

        {/* Record/history line — Án A hanging wooden board (WoodPanel),
            signless: the stats line is the panel's whole content. */}
        <WoodPanel className={styles.panelFlush} bodyClassName={styles.statsBody}>
          <p className={styles.statsText}>
            {m.statsLabel(events.mystery.boxesOpened, events.mystery.bestScore)}
          </p>
        </WoodPanel>

        {activeBox ? (
          <WoodPanel
            title={m.activeTitle}
            titleLevel="h2"
            className={`${styles.panelFlush} ${activeBox.premium ? styles.activePremium : ''}`}
            bodyClassName={styles.activeCard}
          >
            {activeBox.premium ? (
              <div className={styles.activeHead}>
                <Badge tone="cok" className={styles.premiumBadge}>
                  {m.premiumBadge}
                </Badge>
              </div>
            ) : null}

            {activeDish ? (
              <div className={styles.dishRow}>
                <img
                  className={styles.dishImage}
                  src={dishArtFor(activeDish)}
                  alt={activeDish.name}
                />
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
          </WoodPanel>
        ) : (
          <WoodPanel className={styles.panelFlush} bodyClassName={styles.openCard}>
            {/* The gift box is the panel's visual centre: the painted
                mystery icon inside a wooden medallion (emoji fallback
                when the painted icon is missing). */}
            <div className={styles.giftMedallion} aria-hidden="true">
              {gameIcon('mystery') ? (
                <img className={styles.giftIcon} src={gameIcon('mystery')} alt="" />
              ) : (
                <span className={styles.giftEmoji}>🎁</span>
              )}
            </div>

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

              <div className={styles.premiumPanel}>
                <Badge tone="cok" className={styles.premiumBadge}>
                  {m.premiumBadge}
                </Badge>
                <GoldButton
                  className={styles.openButton}
                  disabled={!user}
                  onClick={() => openBox(true)}
                >
                  {m.openPremium(MYSTERY_PREMIUM_PRICE_COK)}
                </GoldButton>
                <p className={styles.premiumNote}>{m.premiumNote}</p>
              </div>
            </div>
          </WoodPanel>
        )}

        {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
      </section>
    </SceneShell>
  );
}

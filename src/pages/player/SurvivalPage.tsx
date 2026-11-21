import { useNavigate } from 'react-router-dom';

import { GoldButton } from '@/components/theme-d/GoldButton';
import { WoodButton } from '@/components/theme-d/WoodButton';
import { WoodPanel } from '@/components/theme-d/WoodPanel';
import { dishArtFor } from '@/components/theme-d/dish-art';
import { gameIcon } from '@/components/theme-d/game-assets';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import {
  SURVIVAL_MAX_STRIKES,
  SURVIVAL_MIN_OWNED,
  SURVIVAL_QUEUE_LENGTH,
  buildSurvivalQueue,
} from '@/features/events/lib/survival';
import { abandonSurvivalRun, startSurvivalRun, useEvents } from '@/features/events/store';
import { isRecipeOwned } from '@/features/recipes/lib/ownership';
import { useTranslation } from '@/i18n/useTranslation';
import { SceneShell } from '@/pages/player/SceneShell';

import eventGate from '@/assets/theme-d/game/r4-event-gate-survival.webp';

import styles from '@/pages/player/SurvivalPage.module.css';

export default function SurvivalPage() {
  const { dict } = useTranslation();
  const s = dict.events.survival;
  const { user } = useAuth();
  const { getApprovedRecipes, getRecipeById } = useRecipes();
  const events = useEvents(user?.id ?? null);
  const navigate = useNavigate();

  if (!events) {
    return (
      <SceneShell>
        <section className={styles.board}>
          <div className={styles.container} />
        </section>
      </SceneShell>
    );
  }

  const owned = user ? getApprovedRecipes().filter((r) => isRecipeOwned(user, r)) : [];
  const current = events.survival.current ?? null;
  const currentDish =
    current && current.queue.length > 0
      ? getRecipeById(current.queue[current.index] ?? '')
      : undefined;

  const start = () => {
    if (!user) return;
    const queue = buildSurvivalQueue(owned, Math.random);
    if (queue.length < SURVIVAL_MIN_OWNED) return;
    const first = queue[0];
    if (!first) return;
    const run = startSurvivalRun(
      user.id,
      queue.map((r) => r.id),
    );
    navigate(`/cooking/${first.id}?survival=${run.id}`);
  };

  const canStart = owned.length >= SURVIVAL_MIN_OWNED;

  return (
    <SceneShell>
      <section className={styles.board}>
        <header className={styles.head}>
          <span className={styles.hangTag}>{dict.nav.survival}</span>
          <div className={styles.titlePlaque}>
            <h1 className={styles.pageTitle}>{s.title}</h1>
            <p className={styles.pageSub}>{s.subtitle}</p>
          </div>
        </header>

        {/* Đợt lan 4: the festival gate with red curtains (r4-event-gate)
            is the page's stage frame — it sways gently and its chest
            glows; the record/start panels stand beneath it. */}
        <div className={styles.gateScene}>
          <img className={styles.gateImg} src={eventGate} alt="" aria-hidden="true" />
          <span className={styles.gateGlow} aria-hidden="true" />
        </div>

        <p className={styles.intro}>{s.intro}</p>

        {/* Record panel — Án A hanging wooden board (WoodPanel); the
            decorative star row, the record line as its headline and
            the runs-played count stay as the panel's content. The
            panel has no title of its own, so the board is signless. */}
        <WoodPanel className={styles.panelFlush} bodyClassName={styles.recordBody}>
          <div className={styles.recordStars} aria-hidden="true">
            <span>★</span>
            <span>★</span>
            <span>★</span>
            <span>★</span>
            <span>★</span>
          </div>
          <p className={styles.recordLabel}>
            {events.survival.bestDishes > 0
              ? s.bestLabel(events.survival.bestDishes, events.survival.bestScore)
              : s.noRecord}
          </p>
          <p className={styles.runsLabel}>{s.runsLabel(events.survival.runsPlayed)}</p>
        </WoodPanel>

        {current ? (
          <WoodPanel
            className={styles.panelFlush}
            bodyClassName={styles.currentCard}
            title={s.progressLabel(current.index + 1, current.queue.length)}
          >
            <div className={styles.progressHead}>
              <div className={styles.strikesBlock}>
                <span className={styles.strikesRow} aria-hidden="true">
                  {Array.from({ length: SURVIVAL_MAX_STRIKES }, (_, i) => (
                    <span
                      key={i}
                      className={`${styles.strikeMark} ${
                        i < current.strikes ? styles.strikeHit : styles.strikeSafe
                      }`}
                    >
                      {i < current.strikes ? '✖' : '🌶'}
                    </span>
                  ))}
                </span>
                <p className={styles.strikesLabel}>
                  {s.strikesLabel(current.strikes, SURVIVAL_MAX_STRIKES)}
                </p>
              </div>
            </div>

            <div className={styles.progressDots} aria-hidden="true">
              {current.queue.map((dishId, i) => (
                <span
                  key={`${dishId}-${i}`}
                  className={`${styles.progressDot} ${
                    i < current.index
                      ? styles.progressDotDone
                      : i === current.index
                        ? styles.progressDotCurrent
                        : styles.progressDotTodo
                  }`}
                />
              ))}
            </div>

            {currentDish ? (
              <div className={styles.currentDishRow}>
                <img
                  className={styles.currentDishThumb}
                  src={dishArtFor(currentDish)}
                  alt={currentDish.name}
                />
                <p className={styles.currentDishName}>{currentDish.name}</p>
              </div>
            ) : null}

            <div className={styles.currentActions}>
              {currentDish ? (
                <GoldButton
                  className={styles.actionButton}
                  onClick={() =>
                    navigate(`/cooking/${currentDish.id}?survival=${current.id}`)
                  }
                >
                  {s.resume}
                </GoldButton>
              ) : null}
              <WoodButton
                className={styles.actionButton}
                disabled={!user}
                onClick={() => {
                  if (user) abandonSurvivalRun(user.id);
                }}
              >
                {s.abandon}
              </WoodButton>
            </div>
          </WoodPanel>
        ) : (
          <WoodPanel className={styles.panelFlush} bodyClassName={styles.startCard}>
            <div className={styles.startMedallion} aria-hidden="true">
              {gameIcon('survival') ? (
                <img className={styles.startMedallionIcon} src={gameIcon('survival')} alt="" />
              ) : (
                <span className={styles.startMedallionEmoji}>🔥</span>
              )}
            </div>
            <GoldButton
              className={styles.startButton}
              disabled={!user || !canStart}
              onClick={start}
            >
              {s.start}
            </GoldButton>
            {!canStart ? <p className={styles.needOwned}>{s.needOwned(SURVIVAL_MIN_OWNED)}</p> : null}
            <p className={styles.queueHint}>{s.queueLabel(SURVIVAL_QUEUE_LENGTH)}</p>
          </WoodPanel>
        )}
      </section>
    </SceneShell>
  );
}

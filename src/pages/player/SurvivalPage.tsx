import { useNavigate } from 'react-router-dom';

import { GoldButton } from '@/components/theme-d/GoldButton';
import { KraftCard } from '@/components/theme-d/KraftCard';
import { WoodButton } from '@/components/theme-d/WoodButton';
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
import { PlayerShell } from '@/pages/player/PlayerShell';

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
      <PlayerShell>
        <div className={styles.container} />
      </PlayerShell>
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
    <PlayerShell>
      <div className={styles.container}>
        <div className={styles.head}>
          <h1 className={styles.title}>{s.title}</h1>
          <p className={styles.subtitle}>{s.subtitle}</p>
        </div>

        <p className={styles.intro}>{s.intro}</p>

        <KraftCard className={styles.recordCard}>
          <p className={styles.recordLabel}>
            {events.survival.bestDishes > 0
              ? s.bestLabel(events.survival.bestDishes, events.survival.bestScore)
              : s.noRecord}
          </p>
          <p className={styles.runsLabel}>{s.runsLabel(events.survival.runsPlayed)}</p>
        </KraftCard>

        {current ? (
          <KraftCard as="section" className={styles.currentCard}>
            <p className={styles.progressLabel}>
              {s.progressLabel(current.index + 1, current.queue.length)}
            </p>
            <p className={styles.strikesLabel}>
              {s.strikesLabel(current.strikes, SURVIVAL_MAX_STRIKES)}
            </p>
            {currentDish ? (
              <p className={styles.currentDishName}>{currentDish.name}</p>
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
          </KraftCard>
        ) : (
          <KraftCard as="section" className={styles.startCard}>
            <GoldButton
              className={styles.actionButton}
              disabled={!user || !canStart}
              onClick={start}
            >
              {s.start}
            </GoldButton>
            {!canStart ? <p className={styles.needOwned}>{s.needOwned(SURVIVAL_MIN_OWNED)}</p> : null}
            <p className={styles.queueHint}>{s.queueLabel(SURVIVAL_QUEUE_LENGTH)}</p>
          </KraftCard>
        )}
      </div>
    </PlayerShell>
  );
}

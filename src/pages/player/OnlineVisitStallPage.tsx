import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { DishGradeFrame } from '@/components/theme-d/DishGradeFrame';
import { KraftCard } from '@/components/theme-d/KraftCard';
import { WoodSign } from '@/components/theme-d/WoodSign';
import { SCENES } from '@/components/theme-d/assets';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { SEED_RECIPES } from '@/data/recipes';
import type { Recipe } from '@/data/types';
import { OnlineGate } from '@/features/online/components/OnlineGate';
import { useOnlineSession } from '@/features/online/components/useOnlineSession';
import { fetchStallVisit } from '@/features/online/lib/api';
import type { StallVisit } from '@/features/online/types';
import { dishGradeFor } from '@/features/recipes/lib/grade';
import { useTranslation } from '@/i18n/useTranslation';
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from '@/pages/player/OnlineVisitStallPage.module.css';

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

/** "HH:MM dd/mm/yyyy" for the stall snapshot stamp. */
function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())} ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function starsText(stars: number): string {
  const filled = Math.min(5, Math.max(0, Math.round(stars)));
  return `${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}`;
}

type VisitState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'empty' }
  | { kind: 'ready'; visit: StallVisit };

function StallContent({ userId }: { userId: string }) {
  const { dict } = useTranslation();
  const o = dict.online;
  const { getRecipeById } = useRecipes();

  const [state, setState] = useState<VisitState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    void (async () => {
      try {
        const visit = await fetchStallVisit(userId);
        if (cancelled) return;
        setState(visit ? { kind: 'ready', visit } : { kind: 'empty' });
      } catch {
        if (!cancelled) setState({ kind: 'error' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (state.kind === 'loading') {
    return (
      <KraftCard as="section" className={styles.noticeCard}>
        <p className={styles.stateText}>{o.loading}</p>
      </KraftCard>
    );
  }
  if (state.kind === 'error') {
    return (
      <KraftCard as="section" className={styles.noticeCard}>
        <p className={styles.stateText}>{o.loadError}</p>
      </KraftCard>
    );
  }
  if (state.kind === 'empty') {
    return (
      <KraftCard as="section" className={styles.noticeCard}>
        <p className={styles.stateText}>{o.visitNoStall}</p>
      </KraftCard>
    );
  }

  const { visit } = state;
  const menuRecipes: Recipe[] = visit.menuIds
    .map((id) => getRecipeById(id) ?? SEED_RECIPES.find((r) => r.id === id))
    .filter((r): r is Recipe => Boolean(r));

  return (
    <>
      <div className={styles.stage}>
        <img src={SCENES['canh-quay']} alt="" className={styles.stageImage} />
        <div className={styles.stageSign}>
          <WoodSign title={o.stallOf(visit.displayName)} />
        </div>
      </div>

      <KraftCard as="section" className={styles.infoCard}>
        <div className={styles.infoRow}>
          <span className={styles.infoText}>{o.stallLevelLabel(visit.stallLevel)}</span>
          <span className={styles.infoText}>
            {o.stallStarsLabel(visit.stars)}{' '}
            <span className={styles.stars} aria-hidden="true">
              {starsText(visit.stars)}
            </span>
          </span>
        </div>
        <p className={styles.updatedText}>{o.visitUpdated(formatDateTime(visit.updatedAt))}</p>

        {visit.decorIds.length > 0 ? (
          <>
            <h2 className={styles.sectionTitle}>{o.visitDecorTitle}</h2>
            <ul className={styles.chipList}>
              {visit.decorIds.map((decorId) => (
                <li key={decorId} className={styles.chip}>
                  {o.visitDecorNames[decorId] ?? decorId}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </KraftCard>

      <KraftCard as="section" className={styles.infoCard}>
        <h2 className={styles.sectionTitle}>{o.visitMenuTitle}</h2>
        {menuRecipes.length === 0 ? (
          <p className={styles.stateText}>{o.visitMenuEmpty}</p>
        ) : (
          <ul className={styles.menuGrid}>
            {menuRecipes.map((recipe) => {
              const grade = dishGradeFor(recipe);
              const gradeLabel = dict.recipe.gradeNames[grade - 1] ?? '';
              return (
                <li key={recipe.id}>
                  <DishGradeFrame grade={grade} gradeLabel={gradeLabel}>
                    <div className={styles.dishInner}>
                      <img src={recipe.image} alt="" className={styles.dishImage} />
                      <span className={styles.dishName}>{recipe.name}</span>
                    </div>
                  </DishGradeFrame>
                </li>
              );
            })}
          </ul>
        )}
      </KraftCard>
    </>
  );
}

/**
 * Stall visit (Gói H9, lát B): a strictly read-only look at another
 * player's stall — scene, level and stars, decorations and the menu
 * on sale. Nothing here writes to anyone's data.
 */
export default function OnlineVisitStallPage() {
  const { dict } = useTranslation();
  const o = dict.online;
  const { user } = useAuth();
  const session = useOnlineSession(user);
  const { userId } = useParams<{ userId: string }>();

  return (
    <PlayerShell>
      <div className={styles.container}>
        <div className={styles.head}>
          <h1 className={styles.title}>{o.visitTitle}</h1>
          <p className={styles.subtitle}>{o.visitSubtitle}</p>
        </div>

        <Link to="/online/visit" className={styles.backLink}>
          {o.backToHub}
        </Link>

        <OnlineGate session={session}>
          {session.link && userId ? <StallContent userId={userId} /> : null}
        </OnlineGate>
      </div>
    </PlayerShell>
  );
}

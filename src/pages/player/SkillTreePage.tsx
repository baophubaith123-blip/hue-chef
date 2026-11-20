import { GoldButton } from '@/components/theme-d/GoldButton';
import { WoodPanel } from '@/components/theme-d/WoodPanel';
import { useAuth } from '@/contexts/AuthContext';
import {
  SKILL_BRANCH_IDS,
  SKILL_MAX_TIER,
  emptySkillTiers,
  skillPointsAvailable,
  skillPointsTotalForLevel,
} from '@/features/skills/lib/skills';
import { unlockSkillTier, useSkills } from '@/features/skills/store';
import type { SkillBranchId } from '@/features/skills/types';
import { useTranslation } from '@/i18n/useTranslation';
import { SceneShell } from '@/pages/player/SceneShell';

import badgeBlank from '@/assets/theme-d/game/r4-badge-blank.webp';
import skillLadder from '@/assets/theme-d/game/r4-skill-ladder.webp';

import styles from '@/pages/player/SkillTreePage.module.css';

const BRANCH_ICONS: Record<SkillBranchId, string> = {
  knife: '🔪',
  fire: '🔥',
  seasoning: '🧂',
  speed: '⚡',
};

type TierState = 'unlocked' | 'next' | 'locked';

function tierStateFor(tier: number, current: number): TierState {
  if (tier <= current) return 'unlocked';
  if (tier === current + 1) return 'next';
  return 'locked';
}

export default function SkillTreePage() {
  const { dict } = useTranslation();
  const { user } = useAuth();
  const s = dict.skills;

  const storedTiers = useSkills(user?.id ?? null);
  const tiers = storedTiers ?? emptySkillTiers();
  const level = user?.level ?? 1;
  const totalPoints = skillPointsTotalForLevel(level);
  const available = skillPointsAvailable(level, tiers);

  return (
    <SceneShell>
      <section className={styles.board}>
        <span className={`${styles.rivet} ${styles.rivetTl}`} aria-hidden="true" />
        <span className={`${styles.rivet} ${styles.rivetTr}`} aria-hidden="true" />
        <span className={`${styles.rivet} ${styles.rivetBl}`} aria-hidden="true" />
        <span className={`${styles.rivet} ${styles.rivetBr}`} aria-hidden="true" />

        <header className={styles.head}>
          <span className={styles.hangTag}>{dict.nav.skills}</span>
          <div className={styles.titlePlaque}>
            <h1 className={styles.pageTitle}>{s.title}</h1>
            <p className={styles.pageSub}>{s.subtitle}</p>
          </div>
        </header>

        <div className={styles.pointsPlaque}>
          <span className={styles.pointsMedallion} aria-hidden="true">
            <img className={styles.badgeImg} src={badgeBlank} alt="" />
            <span className={styles.badgeNum}>{available}</span>
          </span>
          <div className={styles.pointsBody}>
            <p className={styles.pointsLabel}>{s.pointsLabel(available, totalPoints)}</p>
            <p className={styles.levelNote}>{s.levelNote(level)}</p>
            <p className={styles.pointsHint}>{s.pointsHint}</p>
          </div>
        </div>

        <div className={styles.grid}>
          {SKILL_BRANCH_IDS.map((branch) => {
            const current = tiers[branch];
            const isMaxed = current >= SKILL_MAX_TIER;
            const hasPoints = available >= 1;
            const buttonLabel = isMaxed ? s.maxed : hasPoints ? s.unlock : s.needPoints;
            return (
              <WoodPanel
                key={branch}
                title={s.branchNames[branch]}
                titleLevel="h2"
                className={styles.branchPanel}
                bodyClassName={styles.branchBody}
              >
                <img className={styles.ladderSpine} src={skillLadder} alt="" aria-hidden="true" />
                <div className={styles.branchCol}>
                <div className={styles.branchHead}>
                  <span className={styles.branchMedallion} aria-hidden="true">
                    {BRANCH_ICONS[branch]}
                  </span>
                  <div className={styles.branchHeadText}>
                    <span className={styles.tierLabel}>{s.tierLabel(current, SKILL_MAX_TIER)}</span>
                  </div>
                </div>

                <p className={styles.branchDesc}>{s.branchDescs[branch]}</p>
                <p className={styles.branchEffect}>{s.branchEffects[branch]}</p>

                <ol className={styles.ladder} aria-label={s.tierLabel(current, SKILL_MAX_TIER)}>
                  {Array.from({ length: SKILL_MAX_TIER }, (_, index) => index + 1).map((tier) => {
                    const state = tierStateFor(tier, current);
                    const medallionClass =
                      state === 'unlocked'
                        ? styles.medallionUnlocked
                        : state === 'next'
                          ? styles.medallionNext
                          : styles.medallionLocked;
                    const captionClass =
                      state === 'unlocked'
                        ? styles.tierCaptionUnlocked
                        : state === 'next'
                          ? styles.tierCaptionNext
                          : styles.tierCaptionLocked;
                    return (
                      <li key={tier} className={styles.tierRow}>
                        <span className={styles.medallionCell}>
                          <span className={`${styles.medallion} ${medallionClass}`}>
                            <img className={styles.badgeImg} src={badgeBlank} alt="" aria-hidden="true" />
                            <span className={styles.badgeNum}>{tier}</span>
                          </span>
                        </span>
                        <span className={captionClass}>{s.tierLabel(tier, SKILL_MAX_TIER)}</span>
                        {state === 'unlocked' ? (
                          <span className={styles.tierCheck} aria-hidden="true">
                            ✓
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>

                <GoldButton
                  className={styles.unlockButton}
                  disabled={isMaxed || !hasPoints || !user}
                  onClick={() => {
                    if (user) unlockSkillTier(user.id, branch, level);
                  }}
                >
                  {buttonLabel}
                </GoldButton>
                </div>
              </WoodPanel>
            );
          })}
        </div>

        <footer className={styles.boardFoot}>
          <p className={styles.bothLoopsNote}>{s.bothLoopsNote}</p>
        </footer>
      </section>
    </SceneShell>
  );
}

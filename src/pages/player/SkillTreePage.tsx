import { GoldButton } from '@/components/theme-d/GoldButton';
import { KraftCard } from '@/components/theme-d/KraftCard';
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
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from '@/pages/player/SkillTreePage.module.css';

const BRANCH_ICONS: Record<SkillBranchId, string> = {
  knife: '🔪',
  fire: '🔥',
  seasoning: '🧂',
  speed: '⚡',
};

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
    <PlayerShell>
      <div className={styles.container}>
        <div className={styles.head}>
          <h1 className={styles.title}>{s.title}</h1>
          <p className={styles.subtitle}>{s.subtitle}</p>
        </div>

        <KraftCard className={styles.pointsCard}>
          <p className={styles.pointsLabel}>{s.pointsLabel(available, totalPoints)}</p>
          <p className={styles.levelNote}>{s.levelNote(level)}</p>
          <p className={styles.pointsHint}>{s.pointsHint}</p>
        </KraftCard>

        <div className={styles.grid}>
          {SKILL_BRANCH_IDS.map((branch) => {
            const current = tiers[branch];
            const isMaxed = current >= SKILL_MAX_TIER;
            const hasPoints = available >= 1;
            const buttonLabel = isMaxed ? s.maxed : hasPoints ? s.unlock : s.needPoints;
            return (
              <KraftCard as="section" key={branch} className={styles.branchCard}>
                <div className={styles.branchHead}>
                  <span className={styles.branchIcon} aria-hidden="true">
                    {BRANCH_ICONS[branch]}
                  </span>
                  <h2 className={styles.branchName}>{s.branchNames[branch]}</h2>
                </div>
                <p className={styles.branchDesc}>{s.branchDescs[branch]}</p>
                <p className={styles.branchEffect}>{s.branchEffects[branch]}</p>

                <div className={styles.tierRow}>
                  <div className={styles.pips} aria-hidden="true">
                    {Array.from({ length: SKILL_MAX_TIER }, (_, index) => (
                      <span
                        key={index}
                        className={index < current ? styles.pipFilled : styles.pipEmpty}
                      />
                    ))}
                  </div>
                  <span className={styles.tierLabel}>{s.tierLabel(current, SKILL_MAX_TIER)}</span>
                </div>

                <GoldButton
                  className={styles.unlockButton}
                  disabled={isMaxed || !hasPoints || !user}
                  onClick={() => {
                    if (user) unlockSkillTier(user.id, branch, level);
                  }}
                >
                  {buttonLabel}
                </GoldButton>
              </KraftCard>
            );
          })}
        </div>

        <p className={styles.bothLoopsNote}>{s.bothLoopsNote}</p>
      </div>
    </PlayerShell>
  );
}

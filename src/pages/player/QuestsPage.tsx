import { useRef, useState, type ReactNode } from 'react';

import { Badge } from '@/components/theme-d/Badge';
import { GoldButton } from '@/components/theme-d/GoldButton';
import { KraftCard } from '@/components/theme-d/KraftCard';
import { Toast, type ToastTone } from '@/components/theme-d/Toast';
import { WoodButton } from '@/components/theme-d/WoodButton';
import { useAuth } from '@/contexts/AuthContext';
import { CheckinPanel } from '@/features/events/components/CheckinPanel';
import { CHAIN_CHEST_XU, CHAIN_STEPS, questDefById } from '@/features/events/lib/quests';
import { claimChainChest, claimQuest, useEvents } from '@/features/events/store';
import type { QuestInstance } from '@/features/events/types';
import { grantCard } from '@/features/stall/store';
import { useTranslation } from '@/i18n/useTranslation';
import { buzz, celebrate } from '@/lib/juice';
import { playSound } from '@/lib/sound';
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from '@/pages/player/QuestsPage.module.css';

/**
 * Quests page (Gói H7, ý tưởng 2 + 20): the check-in panel on top, the
 * daily and weekly quest boards, and the five-step quest chain whose
 * chest pays xu plus two rescue cards. Rewards come back from the
 * events store and are booked through AuthContext / the stall store,
 * keeping every wallet's single-writer law intact.
 */
export default function QuestsPage() {
  const { dict } = useTranslation();
  const { user, addCoins } = useAuth();
  const events = useEvents(user?.id ?? null);

  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (message: string, tone: ToastTone) => {
    setToast({ message, tone });
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4200);
  };

  if (!user || !events) {
    return (
      <PlayerShell>
        <div className={styles.container} />
      </PlayerShell>
    );
  }

  const q = dict.events.quests;
  const { chain } = events;

  const handleClaimQuest = (scope: 'daily' | 'weekly', defId: string) => {
    const reward = claimQuest(user.id, scope, defId);
    if (reward === null) return;
    if (reward > 0) addCoins(reward);
    // Gói H8: quest rewards land with a coin sound and a small burst.
    playSound('coin');
    celebrate('small');
    showToast(q.claimedToast(reward), 'success');
  };

  const handleClaimChest = () => {
    const result = claimChainChest(user.id);
    if (!result) return;
    if (result.xu > 0) addCoins(result.xu);
    for (const kind of result.cards) {
      grantCard(user.id, kind);
    }
    // Gói H8: the chain chest is a big moment — chest arp + big burst.
    playSound('chest');
    celebrate('big');
    buzz([40, 40, 80]);
    showToast(q.chestToast(result.xu), 'success');
  };

  const renderQuestRow = (scope: 'daily' | 'weekly', instance: QuestInstance): ReactNode => {
    const def = questDefById(instance.defId);
    if (!def) return null;
    const textFn = q.metricText[def.metric];
    const text = textFn ? textFn(def.target) : instance.defId;
    const pct = Math.min(100, Math.round((instance.progress / def.target) * 100));
    const done = instance.progress >= def.target;
    return (
      <li key={instance.defId} className={styles.questRow}>
        <div className={styles.questMain}>
          <p className={styles.questText}>{text}</p>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
          <div className={styles.questMeta}>
            <span className={styles.questCount}>
              {instance.progress}/{def.target}
            </span>
            <Badge tone="gold">{q.rewardLabel(def.rewardXu)}</Badge>
            {done && !instance.claimed ? <Badge tone="brick">{q.done}</Badge> : null}
          </div>
        </div>
        <div className={styles.questAction}>
          {instance.claimed ? (
            <span className={styles.claimedLabel}>{q.claimed}</span>
          ) : done ? (
            <GoldButton onClick={() => handleClaimQuest(scope, instance.defId)}>{q.claim}</GoldButton>
          ) : null}
        </div>
      </li>
    );
  };

  const chainDone = chain.stepIndex >= CHAIN_STEPS.length;
  const currentStepDef = !chainDone ? CHAIN_STEPS[chain.stepIndex] : undefined;
  const currentStepPct = currentStepDef
    ? Math.min(100, Math.round((chain.progress / currentStepDef.target) * 100))
    : 0;

  return (
    <PlayerShell>
      <div className={styles.container}>
        <div className={styles.head}>
          <h1 className={styles.title}>{q.title}</h1>
          <p className={styles.subtitle}>{q.subtitle}</p>
        </div>

        <CheckinPanel />

        <KraftCard as="section" className={styles.board}>
          <h2 className={styles.boardTitle}>{q.dailyTitle}</h2>
          {events.daily ? (
            <ul className={styles.questList}>
              {events.daily.quests.map((instance) => renderQuestRow('daily', instance))}
            </ul>
          ) : null}
        </KraftCard>

        <KraftCard as="section" className={styles.board}>
          <h2 className={styles.boardTitle}>{q.weeklyTitle}</h2>
          {events.weekly ? (
            <ul className={styles.questList}>
              {events.weekly.quests.map((instance) => renderQuestRow('weekly', instance))}
            </ul>
          ) : null}
        </KraftCard>

        <KraftCard as="section" className={styles.board}>
          <h2 className={styles.boardTitle}>{q.chainTitle}</h2>
          <p className={styles.chainIntro}>{q.chainIntro}</p>

          <ol className={styles.chainList}>
            {CHAIN_STEPS.map((step, index) => {
              const isDone = index < chain.stepIndex;
              const isCurrent = index === chain.stepIndex;
              const stepClass = [
                styles.chainStep,
                isDone ? styles.chainStepDone : '',
                isCurrent ? styles.chainStepCurrent : '',
                !isDone && !isCurrent ? styles.chainStepLocked : '',
              ]
                .filter(Boolean)
                .join(' ');
              const stepTextFn = q.metricText[step.metric];
              return (
                <li key={step.id} className={stepClass}>
                  <span className={styles.chainStepMark} aria-hidden="true">
                    {isDone ? '✓' : isCurrent ? '▶' : '🔒'}
                  </span>
                  <div className={styles.chainStepMain}>
                    <span className={styles.chainStepLabel}>
                      {q.stepLabel(index + 1, CHAIN_STEPS.length)}
                    </span>
                    <span className={styles.chainStepText}>
                      {stepTextFn ? stepTextFn(step.target) : step.id}
                    </span>
                    {isCurrent ? (
                      <>
                        <div
                          className={styles.progressTrack}
                          role="progressbar"
                          aria-valuenow={currentStepPct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div className={styles.progressFill} style={{ width: `${currentStepPct}%` }} />
                        </div>
                        <span className={styles.questCount}>
                          {chain.progress}/{step.target}
                        </span>
                      </>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>

          <div className={styles.chest}>
            <div className={styles.chestText}>
              <h3 className={styles.chestTitle}>
                <span aria-hidden="true">🎁</span> {q.chestTitle}
              </h3>
              <p className={styles.chestBody}>{q.chestBody(CHAIN_CHEST_XU)}</p>
            </div>
            <div className={styles.chestAction}>
              {chain.chestClaimed ? (
                <span className={styles.claimedLabel}>{q.chestClaimed}</span>
              ) : chainDone ? (
                <GoldButton onClick={handleClaimChest}>{q.chestClaim}</GoldButton>
              ) : (
                <>
                  <WoodButton disabled>{q.chestClaim}</WoodButton>
                  <span className={styles.chestLocked}>{q.chestLocked}</span>
                </>
              )}
            </div>
          </div>
        </KraftCard>

        {toast ? (
          <div className={styles.toastBox}>
            <Toast message={toast.message} tone={toast.tone} />
          </div>
        ) : null}
      </div>
    </PlayerShell>
  );
}

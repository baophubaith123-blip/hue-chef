import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { GoldButton } from '@/components/theme-d/GoldButton';
import { KraftCard } from '@/components/theme-d/KraftCard';
import { useAuth } from '@/contexts/AuthContext';
import { OnlineGate } from '@/features/online/components/OnlineGate';
import { useOnlineSession } from '@/features/online/components/useOnlineSession';
import { fetchDirectory } from '@/features/online/lib/api';
import type { OnlineLink, OnlineProfile } from '@/features/online/types';
import { useTranslation } from '@/i18n/useTranslation';
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from '@/pages/player/OnlineVisitPage.module.css';

function VisitListContent({ link }: { link: OnlineLink }) {
  const { dict } = useTranslation();
  const o = dict.online;
  const navigate = useNavigate();

  const [players, setPlayers] = useState<OnlineProfile[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const directory = await fetchDirectory();
        if (!cancelled) setPlayers(directory.filter((p) => p.id !== link.onlineId));
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [link.onlineId]);

  return (
    <KraftCard as="section" className={styles.listCard}>
      <h2 className={styles.cardTitle}>{o.playersTitle}</h2>
      {loadFailed ? (
        <p className={styles.stateText}>{o.loadError}</p>
      ) : players === null ? (
        <p className={styles.stateText}>{o.loading}</p>
      ) : players.length === 0 ? (
        <p className={styles.stateText}>{o.playersEmpty}</p>
      ) : (
        <ul className={styles.playerList}>
          {players.map((player) => (
            <li key={player.id} className={styles.playerRow}>
              <div className={styles.playerMain}>
                <span className={styles.playerName}>{player.displayName}</span>
                <span className={styles.playerLevel}>{o.levelLabel(player.level)}</span>
              </div>
              <GoldButton onClick={() => navigate(`/online/visit/${player.id}`)}>
                {o.visitBtn}
              </GoldButton>
            </li>
          ))}
        </ul>
      )}
    </KraftCard>
  );
}

/**
 * Stall-visit picker (Gói H9, lát B): the public directory minus the
 * player themself; each row leads to that player's read-only stall.
 */
export default function OnlineVisitPage() {
  const { dict } = useTranslation();
  const o = dict.online;
  const { user } = useAuth();
  const session = useOnlineSession(user);

  return (
    <PlayerShell>
      <div className={styles.container}>
        <div className={styles.head}>
          <h1 className={styles.title}>{o.visitTitle}</h1>
          <p className={styles.subtitle}>{o.visitSubtitle}</p>
        </div>

        <Link to="/online" className={styles.backLink}>
          {o.backToHub}
        </Link>

        <OnlineGate session={session}>
          {session.link ? <VisitListContent link={session.link} /> : null}
        </OnlineGate>
      </div>
    </PlayerShell>
  );
}

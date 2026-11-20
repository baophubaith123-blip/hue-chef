import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/theme-d/Badge';
import { GoldButton } from '@/components/theme-d/GoldButton';
import { KraftCard } from '@/components/theme-d/KraftCard';
import { WoodButton } from '@/components/theme-d/WoodButton';
import { useAuth } from '@/contexts/AuthContext';
import { OnlineGate } from '@/features/online/components/OnlineGate';
import { useOnlineSession } from '@/features/online/components/useOnlineSession';
import { fetchDirectory } from '@/features/online/lib/api';
import type { OnlineLink, OnlineProfile } from '@/features/online/types';
import { useTranslation } from '@/i18n/useTranslation';
import { SceneShell } from '@/pages/player/SceneShell';

import podiumArt from '@/assets/theme-d/game/r4-podium.webp';
import postcardArt from '@/assets/theme-d/game/r4-visit-postcard.webp';
import versusArt from '@/assets/theme-d/game/r4-versus-emblem.webp';

import styles from '@/pages/player/OnlinePage.module.css';

function HubContent({ link }: { link: OnlineLink }) {
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
        if (!cancelled) setPlayers(directory);
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    { title: o.duelsCardTitle, body: o.duelsCardBody, to: '/online/duels', art: versusArt },
    { title: o.tournamentCardTitle, body: o.tournamentCardBody, to: '/online/tournament', art: podiumArt },
    { title: o.visitCardTitle, body: o.visitCardBody, to: '/online/visit', art: postcardArt },
  ];

  return (
    <>
      <div className={styles.cardGrid}>
        {cards.map((card) => (
          <KraftCard key={card.to} as="section" className={styles.hubCard}>
            <img className={styles.cardArt} src={card.art} alt="" aria-hidden="true" />
            <h2 className={styles.cardTitle}>{card.title}</h2>
            <p className={styles.cardBody}>{card.body}</p>
            <div className={styles.cardAction}>
              <GoldButton onClick={() => navigate(card.to)}>{o.openBtn}</GoldButton>
            </div>
          </KraftCard>
        ))}
      </div>

      <KraftCard as="section" className={styles.playersCard}>
        <h2 className={styles.cardTitle}>{o.playersTitle}</h2>
        {loadFailed ? (
          <p className={styles.stateText}>{o.loadError}</p>
        ) : players === null ? (
          <p className={styles.stateText}>{o.loading}</p>
        ) : players.length === 0 ? (
          <p className={styles.stateText}>{o.playersEmpty}</p>
        ) : (
          <ul className={styles.playerList}>
            {players.map((player) => {
              const isMe = player.id === link.onlineId;
              return (
                <li key={player.id} className={styles.playerRow}>
                  <div className={styles.playerMain}>
                    <span className={styles.playerName}>{player.displayName}</span>
                    <span className={styles.playerLevel}>{o.levelLabel(player.level)}</span>
                    {isMe ? <Badge tone="gold">{o.youTag}</Badge> : null}
                  </div>
                  {isMe ? null : (
                    <div className={styles.playerActions}>
                      <WoodButton onClick={() => navigate(`/online/visit/${player.id}`)}>
                        {o.visitBtn}
                      </WoodButton>
                      <GoldButton onClick={() => navigate('/online/duels')}>
                        {o.challengeBtn}
                      </GoldButton>
                    </div>
                  )}
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
 * Online hub (Gói H9, lát B): the gate (sign-in / sync) on top, then
 * the three arena entries — duels, weekly tournament, stall visits —
 * and the public player directory.
 */
export default function OnlinePage() {
  const { dict } = useTranslation();
  const o = dict.online;
  const { user } = useAuth();
  const session = useOnlineSession(user);

  return (
    <SceneShell>
      <div className={styles.container}>
        <div className={styles.head}>
          <h1 className={styles.title}>{o.title}</h1>
          <p className={styles.subtitle}>{o.subtitle}</p>
        </div>

        <OnlineGate session={session}>
          {session.link ? <HubContent link={session.link} /> : null}
        </OnlineGate>
      </div>
    </SceneShell>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Badge } from '@/components/theme-d/Badge';
import { GoldButton } from '@/components/theme-d/GoldButton';
import { KraftCard } from '@/components/theme-d/KraftCard';
import { Podium, type PodiumEntry } from '@/components/theme-d/Podium';
import { SCENES } from '@/components/theme-d/assets';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { SEED_RECIPES } from '@/data/recipes';
import { OnlineGate } from '@/features/online/components/OnlineGate';
import { useOnlineSession } from '@/features/online/components/useOnlineSession';
import { fetchMyTournamentEntry, fetchTournamentEntries } from '@/features/online/lib/api';
import {
  currentWeekKey,
  isTournamentOpen,
  tournamentRecipeId,
  weekWindow,
} from '@/features/online/lib/tournament';
import type { OnlineLink, TournamentEntry } from '@/features/online/types';
import { useTranslation } from '@/i18n/useTranslation';
import { formatDate } from '@/lib/format';
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from '@/pages/player/OnlineTournamentPage.module.css';

interface TournamentContentProps {
  link: OnlineLink;
}

function TournamentContent({ link }: TournamentContentProps) {
  const { dict } = useTranslation();
  const o = dict.online;
  const navigate = useNavigate();
  const { getApprovedRecipes } = useRecipes();

  const weekKey = useMemo(() => currentWeekKey(), []);
  const recipeId = useMemo(() => tournamentRecipeId(weekKey), [weekKey]);
  const open = useMemo(() => isTournamentOpen(), []);
  const windowText = useMemo(() => {
    const win = weekWindow(weekKey);
    return o.weekWindow(
      formatDate(win.opensAt.toISOString()),
      formatDate(win.closesAt.toISOString()),
    );
  }, [weekKey, o]);

  const recipe =
    getApprovedRecipes().find((r) => r.id === recipeId) ??
    SEED_RECIPES.find((r) => r.id === recipeId);

  const [entries, setEntries] = useState<TournamentEntry[] | null>(null);
  const [myEntry, setMyEntry] = useState<TournamentEntry | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [board, mine] = await Promise.all([
          fetchTournamentEntries(weekKey),
          fetchMyTournamentEntry(weekKey, link.onlineId),
        ]);
        if (cancelled) return;
        setEntries(board);
        setMyEntry(mine);
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [weekKey, link.onlineId]);

  const sorted = useMemo(
    () => [...(entries ?? [])].sort((a, b) => b.score - a.score),
    [entries],
  );
  const podiumEntries: PodiumEntry[] = sorted.slice(0, 3).map((entry, index) => ({
    id: entry.userId,
    name: entry.displayName,
    score: entry.score,
    rank: (index + 1) as 1 | 2 | 3,
  }));
  const myRank = sorted.findIndex((entry) => entry.userId === link.onlineId) + 1;

  return (
    <>
      <KraftCard as="section" className={styles.dishCard}>
        <img src={SCENES['nen-xep-hang']} alt="" className={styles.sceneBanner} />
        <p className={styles.weekWindow}>{windowText}</p>
        <p className={styles.weekDishLabel}>{o.weekDishLabel}</p>
        {recipe ? (
          <div className={styles.dishRow}>
            <img src={recipe.image} alt="" className={styles.dishImage} />
            <span className={styles.dishName}>{recipe.name}</span>
          </div>
        ) : (
          <p className={styles.dishName}>{recipeId}</p>
        )}
        <p className={styles.myBest}>
          {myEntry ? o.myBestLabel(myEntry.score, myEntry.stars) : o.myNoEntry}
        </p>
        <div className={styles.playAction}>
          <GoldButton
            disabled={!open}
            onClick={() => navigate(`/cooking/${recipeId}?tournament=${weekKey}`)}
          >
            {o.playTournamentBtn}
          </GoldButton>
        </div>
        {open ? (
          <p className={styles.hint}>{o.tournamentHint}</p>
        ) : (
          <p className={styles.hint}>{o.closedNote}</p>
        )}
      </KraftCard>

      <KraftCard as="section" className={styles.board}>
        <h2 className={styles.boardTitle}>{o.boardTitle}</h2>
        {loadFailed ? (
          <p className={styles.stateText}>{o.loadError}</p>
        ) : entries === null ? (
          <p className={styles.stateText}>{o.loading}</p>
        ) : sorted.length === 0 ? (
          <p className={styles.stateText}>{o.boardEmpty}</p>
        ) : (
          <>
            {podiumEntries.length > 0 ? (
              <Podium entries={podiumEntries} scoreLabel={dict.recipe.pts} />
            ) : null}
            <ul className={styles.rankList}>
              {sorted.map((entry, index) => {
                const isMe = entry.userId === link.onlineId;
                return (
                  <li
                    key={entry.userId}
                    className={`${styles.rankRow} ${isMe ? styles.rankRowMine : ''}`}
                  >
                    <span className={styles.rankLabel}>{o.rankLabel(index + 1)}</span>
                    <span className={styles.rankName}>{entry.displayName}</span>
                    {isMe ? <Badge tone="gold">{o.youTag}</Badge> : null}
                    <span className={styles.rankScore}>{o.scoreLabel(entry.score)}</span>
                  </li>
                );
              })}
            </ul>
            {myRank === 1 ? <p className={styles.championNote}>{o.championNote}</p> : null}
          </>
        )}
      </KraftCard>
    </>
  );
}

/**
 * Weekly tournament page (Gói H9, lát B): the week's shared dish, the
 * player's own best entry, the play entry point (the run itself is
 * booked by CookingPage) and the live board with a Theme D podium.
 */
export default function OnlineTournamentPage() {
  const { dict } = useTranslation();
  const o = dict.online;
  const { user } = useAuth();
  const session = useOnlineSession(user);

  return (
    <PlayerShell>
      <div className={styles.container}>
        <div className={styles.head}>
          <h1 className={styles.title}>{o.tournamentTitle}</h1>
          <p className={styles.subtitle}>{o.tournamentSubtitle}</p>
        </div>

        <Link to="/online" className={styles.backLink}>
          {o.backToHub}
        </Link>

        <OnlineGate session={session}>
          {session.link ? <TournamentContent link={session.link} /> : null}
        </OnlineGate>
      </div>
    </PlayerShell>
  );
}

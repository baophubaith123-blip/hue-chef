import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Badge } from '@/components/theme-d/Badge';
import { GoldButton } from '@/components/theme-d/GoldButton';
import { KraftCard } from '@/components/theme-d/KraftCard';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import type { PublicUser } from '@/features/auth/types';
import { OnlineGate } from '@/features/online/components/OnlineGate';
import { useOnlineSession } from '@/features/online/components/useOnlineSession';
import { fetchChallenges, fetchDirectory } from '@/features/online/lib/api';
import { patchOnlineUserState } from '@/features/online/store';
import type { Challenge, OnlineLink, OnlineProfile } from '@/features/online/types';
import { useTranslation } from '@/i18n/useTranslation';
import { SceneShell } from '@/pages/player/SceneShell';

import versusArt from '@/assets/theme-d/game/r4-versus-emblem.webp';

import styles from '@/pages/player/OnlineDuelsPage.module.css';

interface DuelsContentProps {
  user: PublicUser;
  link: OnlineLink;
}

function DuelsContent({ user, link }: DuelsContentProps) {
  const { dict } = useTranslation();
  const o = dict.online;
  const navigate = useNavigate();
  const { getApprovedRecipes, getRecipeById } = useRecipes();

  const [challenges, setChallenges] = useState<Challenge[] | null>(null);
  const [directory, setDirectory] = useState<OnlineProfile[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [recipeId, setRecipeId] = useState('');
  const [opponentId, setOpponentId] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [fetchedChallenges, fetchedDirectory] = await Promise.all([
          fetchChallenges(link.onlineId),
          fetchDirectory(),
        ]);
        if (cancelled) return;
        setChallenges(fetchedChallenges);
        setDirectory(fetchedDirectory);
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [link.onlineId]);

  const nameOf = useMemo(() => {
    const map = new Map(directory.map((p) => [p.id, p.displayName]));
    return (id: string): string => map.get(id) ?? id;
  }, [directory]);

  const dishNameOf = (id: string): string => getRecipeById(id)?.name ?? id;

  // Dishes the player may duel with: bought ∪ already cooked; when the
  // account carries neither list, every approved dish is offered.
  const ownedIds = useMemo(() => {
    const ids = new Set<string>(user.ownedRecipeIds ?? []);
    for (const entry of user.cookedRecipes ?? []) ids.add(entry.recipeId);
    return ids;
  }, [user]);
  const approved = getApprovedRecipes();
  const playable = ownedIds.size > 0 ? approved.filter((r) => ownedIds.has(r.id)) : approved;
  const opponents = directory.filter((p) => p.id !== link.onlineId);

  // Seed each select with its first option once the options arrive.
  useEffect(() => {
    if (!recipeId && playable.length > 0) setRecipeId(playable[0]?.id ?? '');
  }, [playable, recipeId]);
  useEffect(() => {
    if (!opponentId && opponents.length > 0) setOpponentId(opponents[0]?.id ?? '');
  }, [opponents, opponentId]);

  const startChallenge = () => {
    if (!recipeId || !opponentId) return;
    patchOnlineUserState(user.id, {
      duelSession: {
        mode: 'create',
        opponentId,
        opponentName: nameOf(opponentId),
        recipeId,
      },
    });
    navigate(`/cooking/${recipeId}?duel=create`);
  };

  const acceptChallenge = (challenge: Challenge) => {
    patchOnlineUserState(user.id, {
      duelSession: {
        mode: 'answer',
        challengeId: challenge.id,
        recipeId: challenge.recipeId,
        ghost: challenge.challengerGhost,
        opponentName: nameOf(challenge.challengerId),
      },
    });
    navigate(`/cooking/${challenge.recipeId}?duel=${challenge.id}`);
  };

  const inbox = (challenges ?? []).filter(
    (c) => c.status === 'pending' && c.opponentId === link.onlineId,
  );
  const sent = (challenges ?? []).filter(
    (c) => c.status === 'pending' && c.challengerId === link.onlineId,
  );
  const history = (challenges ?? []).filter((c) => c.status === 'done');

  const resultFor = (challenge: Challenge): string => {
    if (challenge.winnerId === null) return o.resultDraw;
    return challenge.winnerId === link.onlineId ? o.resultWin : o.resultLose;
  };
  const scoresFor = (challenge: Challenge): { mine: number; theirs: number } => {
    if (challenge.challengerId === link.onlineId) {
      return { mine: challenge.challengerScore, theirs: challenge.opponentScore ?? 0 };
    }
    return { mine: challenge.opponentScore ?? 0, theirs: challenge.challengerScore };
  };
  const opponentOf = (challenge: Challenge): string =>
    nameOf(challenge.challengerId === link.onlineId ? challenge.opponentId : challenge.challengerId);

  return (
    <>
      <KraftCard as="section" className={styles.board}>
        <img className={styles.versusHero} src={versusArt} alt="" aria-hidden="true" />
        <h2 className={styles.boardTitle}>{o.createTitle}</h2>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{o.pickDishLabel}</span>
            <select
              className={styles.select}
              value={recipeId}
              onChange={(e) => setRecipeId(e.target.value)}
            >
              {playable.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{o.pickOpponentLabel}</span>
            <select
              className={styles.select}
              value={opponentId}
              onChange={(e) => setOpponentId(e.target.value)}
            >
              {opponents.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.displayName}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className={styles.formAction}>
          <GoldButton
            onClick={startChallenge}
            disabled={!recipeId || !opponentId || loadFailed}
          >
            {o.startChallengeBtn}
          </GoldButton>
        </div>
        <p className={styles.hint}>{o.createHint}</p>
      </KraftCard>

      {loadFailed ? (
        <KraftCard as="section" className={styles.board}>
          <p className={styles.stateText}>{o.loadError}</p>
        </KraftCard>
      ) : challenges === null ? (
        <KraftCard as="section" className={styles.board}>
          <p className={styles.stateText}>{o.loading}</p>
        </KraftCard>
      ) : (
        <>
          <KraftCard as="section" className={styles.board}>
            <h2 className={styles.boardTitle}>{o.inboxTitle}</h2>
            {inbox.length === 0 ? (
              <p className={styles.stateText}>{o.inboxEmpty}</p>
            ) : (
              <ul className={styles.rowList}>
                {inbox.map((challenge) => (
                  <li key={challenge.id} className={styles.row}>
                    <div className={styles.rowMain}>
                      <span className={styles.rowTitle}>
                        {o.vsLabel(nameOf(challenge.challengerId))}
                      </span>
                      <span className={styles.rowSub}>
                        {o.dishLabel(dishNameOf(challenge.recipeId))}
                      </span>
                    </div>
                    <GoldButton onClick={() => acceptChallenge(challenge)}>
                      {o.acceptBtn}
                    </GoldButton>
                  </li>
                ))}
              </ul>
            )}
          </KraftCard>

          <KraftCard as="section" className={styles.board}>
            <h2 className={styles.boardTitle}>{o.sentTitle}</h2>
            {sent.length === 0 ? (
              <p className={styles.stateText}>{o.sentEmpty}</p>
            ) : (
              <ul className={styles.rowList}>
                {sent.map((challenge) => (
                  <li key={challenge.id} className={styles.row}>
                    <div className={styles.rowMain}>
                      <span className={styles.rowTitle}>
                        {o.vsLabel(nameOf(challenge.opponentId))}
                      </span>
                      <span className={styles.rowSub}>
                        {o.dishLabel(dishNameOf(challenge.recipeId))}
                      </span>
                    </div>
                    <span className={styles.waitingNote}>{o.waitingNote}</span>
                  </li>
                ))}
              </ul>
            )}
          </KraftCard>

          <KraftCard as="section" className={styles.board}>
            <h2 className={styles.boardTitle}>{o.historyTitle}</h2>
            {history.length === 0 ? (
              <p className={styles.stateText}>{o.historyEmpty}</p>
            ) : (
              <ul className={styles.rowList}>
                {history.map((challenge) => {
                  const scores = scoresFor(challenge);
                  return (
                    <li key={challenge.id} className={styles.row}>
                      <div className={styles.rowMain}>
                        <span className={styles.rowTitle}>{o.vsLabel(opponentOf(challenge))}</span>
                        <span className={styles.rowSub}>
                          {o.dishLabel(dishNameOf(challenge.recipeId))}
                        </span>
                        <span className={styles.rowSub}>
                          {o.scoreLine(scores.mine, scores.theirs)}
                        </span>
                      </div>
                      <Badge
                        tone={
                          challenge.winnerId === null
                            ? 'paper'
                            : challenge.winnerId === link.onlineId
                              ? 'gold'
                              : 'brick'
                        }
                      >
                        {resultFor(challenge)}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </KraftCard>
        </>
      )}
    </>
  );
}

/**
 * Duels page (Gói H9, lát B): create an asynchronous challenge (the
 * cooking run itself is recorded by CookingPage from the duelSession),
 * answer incoming challenges against the challenger's ghost, and read
 * back the finished head-to-head history.
 */
export default function OnlineDuelsPage() {
  const { dict } = useTranslation();
  const o = dict.online;
  const { user } = useAuth();
  const session = useOnlineSession(user);

  return (
    <SceneShell>
      <div className={styles.container}>
        <div className={styles.head}>
          <h1 className={styles.title}>{o.duelsTitle}</h1>
          <p className={styles.subtitle}>{o.duelsSubtitle}</p>
        </div>

        <Link to="/online" className={styles.backLink}>
          {o.backToHub}
        </Link>

        <OnlineGate session={session}>
          {user && session.link ? <DuelsContent user={user} link={session.link} /> : null}
        </OnlineGate>
      </div>
    </SceneShell>
  );
}

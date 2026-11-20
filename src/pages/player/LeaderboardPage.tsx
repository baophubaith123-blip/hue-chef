import { useEffect, useMemo, useState } from 'react';

import { AchievementIcon } from '@/components/AchievementIcon';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { loadUsers } from '@/features/auth/store';
import { useTranslation } from '@/i18n/useTranslation';
import { SceneShell } from '@/pages/player/SceneShell';

import podiumArt from '@/assets/theme-d/game/r4-podium.webp';

import styles from './LeaderboardPage.module.css';

type TimeFrame = 'weekly' | 'monthly' | 'allTime';


export default function LeaderboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('weekly');
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [timeFrame]);

  // Real-time board: re-read the stored scores when this tab regains focus,
  // when another tab writes storage, and on a light 5s heartbeat. Combined
  // with the AuthContext `user` dependency below, a fresh cook shows up
  // here without a page reload.
  const [refreshTick, setRefreshTick] = useState(0);
  useEffect(() => {
    const bump = () => setRefreshTick((n) => n + 1);
    const interval = window.setInterval(bump, 5000);
    window.addEventListener('storage', bump);
    window.addEventListener('focus', bump);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('storage', bump);
      window.removeEventListener('focus', bump);
    };
  }, []);

  const { leaderboardData, prevRankById } = useMemo(() => {
    const users = loadUsers();
    const players = users.filter(
      (u) => u.role === 'player' && u.status !== 'banned' && !u.guest,
    );

    const dayMs = 24 * 60 * 60 * 1000;
    const windowMs = timeFrame === 'weekly' ? 7 * dayMs : timeFrame === 'monthly' ? 30 * dayMs : null;
    const now = Date.now();

    const scoreWhere = (inWindow: (cookedAtMs: number) => boolean) =>
      players.map((p) => {
        const cooked = (p.cookedRecipes ?? []).filter((r) =>
          inWindow(new Date(r.cookedAt).getTime()),
        );
        return {
          id: p.id,
          name: p.name,
          email: p.email,
          avatar: p.avatar,
          level: p.level ?? 1,
          totalScore: cooked.reduce((sum, r) => sum + (r.score ?? 0), 0),
          cookedCount: cooked.length,
          equippedAchievementId: p.equippedAchievementId,
        };
      });

    const sortRanked = (rows: ReturnType<typeof scoreWhere>) => {
      const ranked = rows.filter((p) => p.totalScore > 0);
      ranked.sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore;
        }
        return b.level - a.level;
      });
      return ranked;
    };

    const ranked = sortRanked(
      scoreWhere((t) => (windowMs === null ? true : now - t <= windowMs)),
    );

    // Previous-period ranking for trend arrows: the window right before the
    // current one (all-time compares against the standings 7 days ago).
    const prevRanked = sortRanked(
      scoreWhere((t) =>
        windowMs === null
          ? t <= now - 7 * dayMs
          : now - t > windowMs && now - t <= windowMs * 2,
      ),
    );
    const prevMap = new Map<string, number>();
    prevRanked.forEach((p, idx) => prevMap.set(p.id, idx + 1));

    return { leaderboardData: ranked, prevRankById: prevMap };
  }, [timeFrame, refreshTick, user]);

  const rank1 = leaderboardData[0];
  const rank2 = leaderboardData[1];
  const rank3 = leaderboardData[2];
  const restPlayers = leaderboardData.slice(3);

  return (
    <SceneShell>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <span className={styles.trophyIcon} aria-hidden="true">🏆</span>
            <h1 className={styles.title}>Bảng xếp hạng Đầu Bếp</h1>
          </div>

          {/* Timeframe Filter Pills (Image 1 Style) */}
          <div className={styles.filterTabs} role="tablist" aria-label="Khung thời gian xếp hạng">
            <button
              type="button"
              role="tab"
              aria-selected={timeFrame === 'weekly'}
              className={`${styles.tabBtn} ${timeFrame === 'weekly' ? styles.tabBtnActive : ''}`}
              onClick={() => setTimeFrame('weekly')}
            >
              Hạng tuần
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={timeFrame === 'monthly'}
              className={`${styles.tabBtn} ${timeFrame === 'monthly' ? styles.tabBtnActive : ''}`}
              onClick={() => setTimeFrame('monthly')}
            >
              Hạng tháng
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={timeFrame === 'allTime'}
              className={`${styles.tabBtn} ${timeFrame === 'allTime' ? styles.tabBtnActive : ''}`}
              onClick={() => setTimeFrame('allTime')}
            >
              Hạng mọi thời đại
            </button>
          </div>
        </header>

        {leaderboardData.length === 0 ? (
          <EmptyState
            title={t('leaderboard.empty')}
            description={t('leaderboard.emptyHint')}
          />
        ) : (
          <div className={styles.boardLayout}>
            {/* Top 3 podium panel (Đợt 4): the painted r4-podium carries
                the steps and medals; real names/scores sit under their
                columns. Balance law: this panel and the rank-list panel
                are grid siblings stretched to the exact same height. */}
            <section className={styles.podiumPanel} data-board="podium">
              <img className={styles.podiumArt} src={podiumArt} alt="" aria-hidden="true" />
              <div className={styles.podiumCols}>
                {[rank2, rank1, rank3].map((entry, i) => {
                  const rank = [2, 1, 3][i];
                  if (!entry) return <div key={rank} />;
                  return (
                    <div key={rank} className={styles.podiumColInfo}>
                      <span className={styles.podiumName}>{entry.name}</span>
                      <span className={styles.podiumScore}>
                        {entry.totalScore.toLocaleString()} pts
                      </span>
                      <span className={styles.podiumLevel}>Lv.{entry.level}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Rank list panel (Đợt 4): r4-rank-list-frame shell, exactly
                5 compact rows per page, round wooden page buttons. */}
            <section className={styles.rankPanel} data-board="ranklist">
              <div className={styles.rankRows}>
                {restPlayers.slice(page * 5, page * 5 + 5).map((player, idx) => {
                  const rank = page * 5 + idx + 4;
                  const isCurrentUser = player.id === user?.id;
                  return (
                    <div
                      key={player.id}
                      className={`${styles.rankingRow} ${isCurrentUser ? styles.currentUserRow : ''}`}
                    >
                      <div className={styles.rankIndex}>#{rank}</div>
                      <div className={styles.playerInfo}>
                        <div className={styles.rowAvatarWrap}>
                          {player.avatar ? (
                            <img src={player.avatar} alt={player.name} className={styles.rowAvatar} />
                          ) : (
                            <div className={styles.rowInitials}>
                              {player.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {player.equippedAchievementId && (
                            <div className={styles.rowBadgeOverlay}>
                              <AchievementIcon badgeId={player.equippedAchievementId} size="xs" />
                            </div>
                          )}
                        </div>
                        <div className={styles.playerNameGroup}>
                          <span className={styles.playerName}>
                            {player.name} {isCurrentUser ? '(Bạn)' : ''}
                          </span>
                          <span className={styles.playerLevel}>Lv.{player.level}</span>
                        </div>
                      </div>
                      <div className={styles.playerScore}>
                        <strong>{player.totalScore.toLocaleString()}</strong> pts
                        {(() => {
                          const prev = prevRankById.get(player.id);
                          if (prev === undefined) return null;
                          const delta = prev - rank;
                          if (delta > 0) return <span className={styles.trendUp}>▲ {delta}</span>;
                          if (delta < 0) return <span className={styles.trendDown}>▼ {Math.abs(delta)}</span>;
                          return <span className={styles.trendFlat}>— 0</span>;
                        })()}
                      </div>
                    </div>
                  );
                })}
                {restPlayers.length === 0 ? (
                  <p className={styles.stateText}>{t('leaderboard.emptyHint')}</p>
                ) : null}
              </div>
              {Math.max(1, Math.ceil(restPlayers.length / 5)) > 1 ? (
                <nav className={styles.pagination} aria-label="Phân trang bảng xếp hạng">
                  <button type="button" className={styles.pageBtn} disabled={page === 0}
                    onClick={() => setPage((n) => Math.max(0, n - 1))} aria-label="Trang trước">‹</button>
                  {Array.from({ length: Math.ceil(restPlayers.length / 5) }, (_, i) => (
                    <button key={i} type="button"
                      className={`${styles.pageBtn} ${i === page ? styles.pageBtnActive : ''}`}
                      onClick={() => setPage(i)} aria-label={`Trang ${i + 1}`}>{i + 1}</button>
                  ))}
                  <button type="button" className={styles.pageBtn}
                    disabled={page >= Math.ceil(restPlayers.length / 5) - 1}
                    onClick={() => setPage((n) => n + 1)} aria-label="Trang sau">›</button>
                </nav>
              ) : null}
            </section>
          </div>
          {/* Own row pinned under the balanced boards when unranked */}
          {user && !leaderboardData.some((p) => p.id === user.id) ? (
                  <div className={`${styles.rankingRow} ${styles.ownRow} ${styles.currentUserRow}`}>
                    <div className={styles.rankIndex}>{leaderboardData.length + 1}</div>
                    <div className={styles.playerInfo}>
                      <div className={styles.rowAvatarWrap}>
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className={styles.rowAvatar} />
                        ) : (
                          <div className={styles.rowInitials}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className={styles.playerNameGroup}>
                        <span className={styles.playerName}>{user.name} (Bạn)</span>
                        <span className={styles.playerLevel}>Lv.{user.level ?? 1}</span>
                      </div>
                    </div>
                    <div className={styles.playerScore}>
                      <strong>0</strong> pts · {t('leaderboard.cookToRank')}
                    </div>
                  </div>
                ) : null}
        )}
      </div>
    </SceneShell>
  );
}

import { useMemo, useState } from 'react';

import { AchievementIcon } from '@/components/AchievementIcon';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { loadUsers } from '@/features/auth/store';
import { useTranslation } from '@/i18n/useTranslation';
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from './LeaderboardPage.module.css';

type TimeFrame = 'weekly' | 'monthly' | 'allTime';


export default function LeaderboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('weekly');

  const leaderboardData = useMemo(() => {
    const users = loadUsers();
    const players = users.filter((u) => u.role === 'player' && u.status !== 'banned');

    const windowMs =
      timeFrame === 'weekly'
        ? 7 * 24 * 60 * 60 * 1000
        : timeFrame === 'monthly'
          ? 30 * 24 * 60 * 60 * 1000
          : null;
    const now = Date.now();

    const mapped = players.map((p) => {
      const allCooked = p.cookedRecipes ?? [];
      const cookedRecipes =
        windowMs === null
          ? allCooked
          : allCooked.filter((r) => now - new Date(r.cookedAt).getTime() <= windowMs);
      const totalScore = cookedRecipes.reduce((sum, r) => sum + (r.score ?? 0), 0);
      const cookedCount = cookedRecipes.length;
      return {
        id: p.id,
        name: p.name,
        email: p.email,
        avatar: p.avatar,
        level: p.level ?? 1,
        totalScore,
        cookedCount,
        equippedAchievementId: p.equippedAchievementId,
      };
    });

    const ranked = mapped.filter((p) => p.totalScore > 0);
    ranked.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      return b.level - a.level;
    });

    return ranked;
  }, [timeFrame]);

  const rank1 = leaderboardData[0];
  const rank2 = leaderboardData[1];
  const rank3 = leaderboardData[2];
  const restPlayers = leaderboardData.slice(3);

  return (
    <PlayerShell>
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
            {/* Top 3 Podium (Image 1 Style) */}
            <div className={styles.podiumSection}>
              {/* Rank 2 (Silver) */}
              {rank2 && (
                <div className={`${styles.podiumCol} ${styles.colRank2}`}>
                  <div className={styles.podiumAvatarWrap}>
                    <span className={styles.rankMedalIcon}>🥈</span>
                    {rank2.avatar ? (
                      <img src={rank2.avatar} alt={rank2.name} className={styles.podiumAvatar} />
                    ) : (
                      <div className={styles.podiumInitials}>
                        {rank2.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className={styles.podiumName}>{rank2.name}</div>
                  <div className={styles.podiumScore}>{rank2.totalScore.toLocaleString()} pts</div>
                  <div className={styles.podiumPillar2}>
                    <span className={styles.pillarNumber}>2</span>
                  </div>
                </div>
              )}

              {/* Rank 1 (Gold - Center) */}
              {rank1 && (
                <div className={`${styles.podiumCol} ${styles.colRank1}`}>
                  <div className={styles.crownWrap} aria-hidden="true">👑</div>
                  <div className={`${styles.podiumAvatarWrap} ${styles.avatarGold}`}>
                    <span className={styles.rankMedalIcon}>🥇</span>
                    {rank1.avatar ? (
                      <img src={rank1.avatar} alt={rank1.name} className={styles.podiumAvatar} />
                    ) : (
                      <div className={styles.podiumInitials}>
                        {rank1.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className={styles.podiumName}>{rank1.name}</div>
                  <div className={styles.podiumScoreGold}>{rank1.totalScore.toLocaleString()} pts</div>
                  <div className={styles.podiumPillar1}>
                    <span className={styles.pillarNumber}>1</span>
                  </div>
                </div>
              )}

              {/* Rank 3 (Bronze) */}
              {rank3 && (
                <div className={`${styles.podiumCol} ${styles.colRank3}`}>
                  <div className={styles.podiumAvatarWrap}>
                    <span className={styles.rankMedalIcon}>🥉</span>
                    {rank3.avatar ? (
                      <img src={rank3.avatar} alt={rank3.name} className={styles.podiumAvatar} />
                    ) : (
                      <div className={styles.podiumInitials}>
                        {rank3.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className={styles.podiumName}>{rank3.name}</div>
                  <div className={styles.podiumScore}>{rank3.totalScore.toLocaleString()} pts</div>
                  <div className={styles.podiumPillar3}>
                    <span className={styles.pillarNumber}>3</span>
                  </div>
                </div>
              )}
            </div>

            {/* Remaining Ranks List (Rank 4+) */}
            <div className={styles.rankingsCard}>
              <div className={styles.rankingsList}>
                {restPlayers.map((player, idx) => {
                  const rank = idx + 4;
                  const isCurrentUser = player.id === user?.id;

                  return (
                    <div
                      key={player.id}
                      className={`${styles.rankingRow} ${isCurrentUser ? styles.currentUserRow : ''}`}
                    >
                      <div className={styles.rankIndex}>{rank}</div>
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
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </PlayerShell>
  );
}

import { useMemo, useState } from 'react';

import { AchievementIcon } from '@/components/AchievementIcon';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { loadUsers } from '@/features/auth/store';
import { useTranslation } from '@/i18n/useTranslation';
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from './LeaderboardPage.module.css';

type TimeFrame = 'weekly' | 'monthly' | 'allTime';

const MOCK_COMMUNITY_LEADERBOARD = [
  {
    id: 'comm-1',
    name: 'GameMaster',
    email: 'gamemaster@hue.vn',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GameMaster',
    level: 18,
    totalScore: 12560,
    cookedCount: 24,
    equippedAchievementId: 'badge-grandmaster',
  },
  {
    id: 'comm-2',
    name: 'Minh Anh',
    email: 'minhanh@hue.vn',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MinhAnh',
    level: 15,
    totalScore: 10230,
    cookedCount: 19,
    equippedAchievementId: 'badge-master',
  },
  {
    id: 'comm-3',
    name: 'Thảo Vy',
    email: 'thaovy@hue.vn',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThaoVy',
    level: 14,
    totalScore: 9870,
    cookedCount: 18,
    equippedAchievementId: 'badge-spice',
  },
  {
    id: 'comm-4',
    name: 'Đắc Thắng',
    email: 'dacthang@hue.vn',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DacThang',
    level: 12,
    totalScore: 8920,
    cookedCount: 15,
    equippedAchievementId: undefined,
  },
  {
    id: 'comm-5',
    name: 'Linh Anh',
    email: 'linhanh@hue.vn',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LinhAnh',
    level: 11,
    totalScore: 8750,
    cookedCount: 14,
    equippedAchievementId: undefined,
  },
  {
    id: 'comm-6',
    name: 'Đức Minh',
    email: 'ducminh@hue.vn',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DucMinh',
    level: 10,
    totalScore: 8600,
    cookedCount: 13,
    equippedAchievementId: undefined,
  },
  {
    id: 'comm-7',
    name: 'Nguyễn Gia Bảo',
    email: 'giabao@hue.vn',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GiaBao',
    level: 9,
    totalScore: 8185,
    cookedCount: 12,
    equippedAchievementId: undefined,
  },
];

export default function LeaderboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('weekly');

  const leaderboardData = useMemo(() => {
    const users = loadUsers();
    const players = users.filter((u) => u.role === 'player' && u.status !== 'banned');

    const mapped = players.map((p) => {
      const cookedRecipes = p.cookedRecipes ?? [];
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

    // Merge with community players if needed so the leaderboard has full competition
    const existingIds = new Set(mapped.map((p) => p.id));
    const merged = [...mapped];
    for (const comm of MOCK_COMMUNITY_LEADERBOARD) {
      if (!existingIds.has(comm.id)) {
        merged.push(comm);
      }
    }

    merged.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      return b.level - a.level;
    });

    return merged;
  }, []);

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

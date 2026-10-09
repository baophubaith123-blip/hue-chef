import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { AchievementIcon } from '@/components/AchievementIcon';
import { EmptyState } from '@/components/EmptyState';
import { loadUsers } from '@/features/auth/store';
import { useTranslation } from '@/i18n/useTranslation';
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from './LeaderboardPage.module.css';

export default function LeaderboardPage() {
  const { t } = useTranslation();

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

    mapped.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      return b.level - a.level;
    });

    return mapped;
  }, []);

  return (
    <PlayerShell>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('leaderboard.title')}</h1>
        <p className={styles.subtitle}>{t('leaderboard.subtitle')}</p>
      </header>

      <div className={styles.card}>
        {leaderboardData.length === 0 ? (
          <EmptyState
            title={t('leaderboard.empty')}
            description={t('leaderboard.emptyHint')}
          />
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('leaderboard.rank')}</th>
                <th>{t('leaderboard.player')}</th>
                <th>{t('leaderboard.cookedCount')}</th>
                <th>{t('leaderboard.totalScore')}</th>
                <th>{t('leaderboard.level')}</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((player, index) => {
                const rank = index + 1;
                const rowClass =
                  rank === 1
                    ? styles.rowTop1
                    : rank === 2
                    ? styles.rowTop2
                    : rank === 3
                    ? styles.rowTop3
                    : '';

                const rankBadgeClass =
                  rank === 1
                    ? `${styles.rankBadge} ${styles.rank1}`
                    : rank === 2
                    ? `${styles.rankBadge} ${styles.rank2}`
                    : rank === 3
                    ? `${styles.rankBadge} ${styles.rank3}`
                    : `${styles.rankBadge} ${styles.rankOther}`;

                return (
                  <tr key={player.id} className={rowClass}>
                    <td>
                      <span className={rankBadgeClass}>
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                      </span>
                    </td>
                    <td>
                      <div className={styles.playerCol}>
                        <div className={styles.avatarWrap}>
                          {player.avatar ? (
                            <img
                              src={player.avatar}
                              alt={player.name}
                              className={styles.avatarImg}
                            />
                          ) : (
                            <div className={styles.avatarFallback}>
                              {player.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {player.equippedAchievementId ? (
                            <div className={styles.badgeOverlay}>
                              <AchievementIcon
                                badgeId={player.equippedAchievementId}
                                size="xs"
                              />
                            </div>
                          ) : null}
                        </div>
                        <div>
                          <Link to={`/profile/${player.id}`} className={styles.playerName}>
                            {player.name}
                          </Link>
                          <p className={styles.playerEmail}>{player.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{player.cookedCount} món</td>
                    <td>
                      <span className={styles.scoreValue}>
                        {player.totalScore.toLocaleString()} pts
                      </span>
                    </td>
                    <td>
                      <span className={styles.levelTag}>Level {player.level}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </PlayerShell>
  );
}

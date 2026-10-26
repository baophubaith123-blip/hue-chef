import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AchievementIcon } from '@/components/AchievementIcon';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { useAchievements } from '@/contexts/AchievementContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { SEED_ACHIEVEMENTS } from '@/data/achievements';
import type { Recipe } from '@/data/types';
import { loadUsers } from '@/features/auth/store';
import { RecipeCard } from '@/features/recipes/components/RecipeCard';
import { formatDate, formatDuration } from '@/lib/format';
import { useTranslation } from '@/i18n/useTranslation';
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from '@/pages/player/HomePage.module.css';

export default function HomePage() {
  const { t, dict } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getApprovedRecipes } = useRecipes();
  const { isUnlocked, getProgressPct } = useAchievements();

  const approvedRecipes = useMemo(() => getApprovedRecipes(), [getApprovedRecipes]);

  // Player stats
  const level = user?.level ?? 1;
  const exp = user?.exp ?? 0;
  const maxExp = user?.maxExp ?? 1000;
  const expPct = Math.min(100, Math.round((exp / (maxExp || 1000)) * 100));

  const cookedRecipes = useMemo(() => user?.cookedRecipes ?? [], [user?.cookedRecipes]);
  const totalScore = useMemo(
    () => cookedRecipes.reduce((sum, r) => sum + (r.score ?? 0), 0),
    [cookedRecipes],
  );
  const distinctCookedRecipeIds = useMemo(
    () => new Set(cookedRecipes.map((r) => r.recipeId)),
    [cookedRecipes],
  );

  // Equipped badge or level-based title
  const equippedBadge = useMemo(() => {
    if (!user?.equippedAchievementId) return null;
    return SEED_ACHIEVEMENTS.find((a) => a.id === user.equippedAchievementId) ?? null;
  }, [user?.equippedAchievementId]);

  const chefTitle = useMemo(() => {
    if (equippedBadge) return equippedBadge.name;
    if (level >= 7) return t('dashboard.titleGrandmaster');
    if (level >= 5) return t('dashboard.titleMaster');
    if (level >= 3) return t('dashboard.titleCook');
    return t('dashboard.titleNovice');
  }, [equippedBadge, level, t]);

  // Greeting by hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greetingMorning');
    if (hour < 18) return t('dashboard.greetingAfternoon');
    return t('dashboard.greetingEvening');
  }, [t]);

  // Leaderboard data & user rank
  const leaderboardData = useMemo(() => {
    const users = loadUsers();
    const players = users.filter((u) => u.role === 'player' && u.status !== 'banned');
    const mapped = players.map((p) => {
      const entries = p.cookedRecipes ?? [];
      const score = entries.reduce((sum, r) => sum + (r.score ?? 0), 0);
      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        level: p.level ?? 1,
        totalScore: score,
        equippedAchievementId: p.equippedAchievementId,
      };
    });
    mapped.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return b.level - a.level;
    });
    return mapped;
  }, []);

  const userRank = useMemo(() => {
    if (!user?.id) return null;
    const idx = leaderboardData.findIndex((p) => p.id === user.id);
    return idx >= 0 ? idx + 1 : null;
  }, [leaderboardData, user?.id]);

  // Unlocked achievements count
  const unlockedBadgesCount = useMemo(() => {
    if (!user?.id) return 0;
    return SEED_ACHIEVEMENTS.filter((a) => isUnlocked(user.id, a.id)).length;
  }, [isUnlocked, user?.id]);

  // Next recipe to cook: lowest difficulty uncompleted dish, or lowest scored dish
  const nextRecipe = useMemo<Recipe | undefined>(() => {
    if (approvedRecipes.length === 0) return undefined;
    const uncooked = approvedRecipes
      .filter((r) => !distinctCookedRecipeIds.has(r.id))
      .sort((a, b) => a.difficulty - b.difficulty);
    if (uncooked.length > 0) return uncooked[0];

    const bestScoresByRecipe = new Map<string, number>();
    for (const entry of cookedRecipes) {
      const curr = bestScoresByRecipe.get(entry.recipeId) ?? 0;
      if (entry.score > curr) bestScoresByRecipe.set(entry.recipeId, entry.score);
    }
    const sortedByScore = [...approvedRecipes].sort((a, b) => {
      const scoreA = bestScoresByRecipe.get(a.id) ?? 0;
      const scoreB = bestScoresByRecipe.get(b.id) ?? 0;
      return scoreA - scoreB;
    });
    return sortedByScore[0];
  }, [approvedRecipes, distinctCookedRecipeIds, cookedRecipes]);

  const isNextRecipeCooked = nextRecipe ? distinctCookedRecipeIds.has(nextRecipe.id) : false;
  const nextRecipeBestScore = useMemo(() => {
    if (!nextRecipe) return 0;
    const matching = cookedRecipes.filter((r) => r.recipeId === nextRecipe.id);
    return matching.reduce((max, r) => Math.max(max, r.score), 0);
  }, [nextRecipe, cookedRecipes]);

  // Thematic suggestions: e.g. Bánh Huế or top 4 recipes
  const themeRecipes = useMemo(() => {
    const banhList = approvedRecipes.filter((r) => r.category === 'banh');
    if (banhList.length >= 3) return banhList.slice(0, 4);
    return approvedRecipes.slice(0, 4);
  }, [approvedRecipes]);

  // Near achievements (top 2-3 closest to 100%)
  const nearAchievements = useMemo(() => {
    if (!user) return [];
    const locked = SEED_ACHIEVEMENTS.filter((a) => !isUnlocked(user.id, a.id));
    const withProgress = locked.map((a) => ({
      achievement: a,
      pct: getProgressPct(user, a.id, {}),
    }));
    withProgress.sort((a, b) => b.pct - a.pct);
    return withProgress.slice(0, 3);
  }, [user, isUnlocked, getProgressPct]);

  // Top 3 chefs for mini leaderboard
  const topThreeChefs = useMemo(() => {
    return leaderboardData.slice(0, 3);
  }, [leaderboardData]);

  // Recent 5 cooking sessions
  const recentCookedHistory = useMemo(() => {
    return [...cookedRecipes].reverse().slice(0, 5);
  }, [cookedRecipes]);

  const handleCookNow = () => {
    if (nextRecipe) {
      navigate(`/cooking/${nextRecipe.id}`);
    } else {
      navigate('/recipes');
    }
  };

  const getRankMedal = (rankIndex: number) => {
    if (rankIndex === 0) return '🥇';
    if (rankIndex === 1) return '🥈';
    if (rankIndex === 2) return '🥉';
    return `#${rankIndex + 1}`;
  };

  return (
    <PlayerShell>
      <div className={styles.dashboard}>
        {/* 1. Hero Banner mang phong cách Cố Đô Cung Đình Huế (Image 6 Target) */}
        <section className={styles.heroBanner} aria-label={dict.dashboard.heroTitleHue}>
          <div className={styles.heroContent}>
            <div className={styles.heroUserBadge}>
              <div className={styles.avatarWrapSmall}>
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className={styles.avatarImg} />
                ) : (
                  <div className={styles.avatarInitialsSmall}>
                    {user?.name?.charAt(0).toUpperCase() || '👨‍🍳'}
                  </div>
                )}
                {user?.equippedAchievementId ? (
                  <div className={styles.avatarBadgeOverlay}>
                    <AchievementIcon badgeId={user.equippedAchievementId} size="xs" />
                  </div>
                ) : null}
              </div>
              <div className={styles.heroUserMeta}>
                <span className={styles.greeting}>{greeting}, <strong>{user?.name}</strong></span>
                <span className={styles.titleTagText}>🎖️ {chefTitle}</span>
              </div>
            </div>

            <h1 className={styles.heroHeading}>
              <span className={styles.heroSubHeading}>{dict.dashboard.heroTitle}</span>
              <span className={styles.heroMainHeading}>{dict.dashboard.heroTitleHue}</span>
            </h1>
            <p className={styles.heroSubtitle}>{dict.dashboard.heroSubtitle}</p>

            <div className={styles.heroActions}>
              <Button variant="primary" className={styles.heroPlayBtn} onClick={handleCookNow}>
                🔥 {dict.dashboard.heroPlayNow}
              </Button>
              <Link to="/recipes" className={styles.heroExploreBtn}>
                🍲 {dict.dashboard.heroExplore}
              </Link>
            </div>
          </div>

          <div className={styles.heroArtwork} aria-hidden="true">
            <div className={styles.heroFoodCircle}>
              <span className={styles.floatingDishEmoji}>🍜</span>
            </div>
          </div>
        </section>

        {/* 2. Chế độ chơi nhanh (Image 1 - 4 interactive cards) */}
        <section className={styles.quickModesSection} aria-label={dict.dashboard.quickModesTitle}>
          <h2 className={styles.quickModesTitle}>{dict.dashboard.quickModesTitle}</h2>
          <div className={styles.quickModesGrid}>
            <Link to="/recipes" className={styles.quickModeCard}>
              <div className={styles.quickModeIcon} aria-hidden="true">👨‍🍳</div>
              <div className={styles.quickModeInfo}>
                <h3 className={styles.quickModeName}>{dict.dashboard.modeFreeCook}</h3>
                <p className={styles.quickModeDesc}>{dict.dashboard.modeFreeCookDesc}</p>
              </div>
              <span className={styles.quickModeArrow}>›</span>
            </Link>

            <Link
              to={nextRecipe ? `/cooking/${nextRecipe.id}` : '/recipes'}
              className={styles.quickModeCard}
            >
              <div className={styles.quickModeIcon} aria-hidden="true">📍</div>
              <div className={styles.quickModeInfo}>
                <h3 className={styles.quickModeName}>{dict.dashboard.modeJourney}</h3>
                <p className={styles.quickModeDesc}>{dict.dashboard.modeJourneyDesc}</p>
              </div>
              <span className={styles.quickModeArrow}>›</span>
            </Link>

            <Link to="/leaderboard" className={styles.quickModeCard}>
              <div className={styles.quickModeIcon} aria-hidden="true">🏆</div>
              <div className={styles.quickModeInfo}>
                <h3 className={styles.quickModeName}>{dict.dashboard.modeDuel}</h3>
                <p className={styles.quickModeDesc}>{dict.dashboard.modeDuelDesc}</p>
              </div>
              <span className={styles.quickModeArrow}>›</span>
            </Link>

            <Link to="/achievements" className={styles.quickModeCard}>
              <div className={styles.quickModeIcon} aria-hidden="true">🎁</div>
              <div className={styles.quickModeInfo}>
                <h3 className={styles.quickModeName}>{dict.dashboard.modeSpecialEvents}</h3>
                <p className={styles.quickModeDesc}>{dict.dashboard.modeSpecialEventsDesc}</p>
              </div>
              <span className={styles.quickModeArrow}>›</span>
            </Link>
          </div>
        </section>

        {/* 3. Thống kê nhanh (4 card) */}
        <section className={styles.statsGrid} aria-label={t('dashboard.statLevel')}>
          {/* Card 1: Level & EXP */}
          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <span className={styles.statLabel}>{t('dashboard.statLevel')}</span>
              <span className={styles.statIcon} aria-hidden>⭐</span>
            </div>
            <div>
              <div className={styles.statValue}>Lv.{level}</div>
              <div className={styles.statSub}>
                {exp} / {maxExp} EXP ({expPct}%)
              </div>
              <div className={styles.progressBarTrack} role="progressbar" aria-valuenow={expPct} aria-valuemin={0} aria-valuemax={100}>
                <div className={styles.progressBarFill} style={{ width: `${expPct}%` }} />
              </div>
            </div>
          </div>

          {/* Card 2: Total score */}
          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <span className={styles.statLabel}>{t('dashboard.statTotalScore')}</span>
              <span className={styles.statIcon} aria-hidden>🌟</span>
            </div>
            <div>
              <div className={styles.statValue}>{totalScore.toLocaleString()}</div>
              <div className={styles.statSub}>{t('dashboard.pts')}</div>
            </div>
          </div>

          {/* Card 3: Cooked dishes */}
          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <span className={styles.statLabel}>{t('dashboard.statCookedCount')}</span>
              <span className={styles.statIcon} aria-hidden>🍲</span>
            </div>
            <div>
              <div className={styles.statValue}>
                {distinctCookedRecipeIds.size} / {approvedRecipes.length}
              </div>
              <div className={styles.statSub}>
                {Math.round((distinctCookedRecipeIds.size / (approvedRecipes.length || 1)) * 100)}% {t('dashboard.statCookedCount').toLowerCase()}
              </div>
            </div>
          </div>

          {/* Card 4: Badges & Rank */}
          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <span className={styles.statLabel}>{t('dashboard.statBadges')}</span>
              <span className={styles.statIcon} aria-hidden>🎖️</span>
            </div>
            <div>
              <div className={styles.statValue}>
                {unlockedBadgesCount} / {SEED_ACHIEVEMENTS.length}
              </div>
              <div className={styles.statSub}>
                {userRank ? t('dashboard.rankBadge', { rank: userRank } as Record<string, unknown>) : t('dashboard.unranked')}
              </div>
            </div>
          </div>
        </section>

        {/* 3. Tiếp tục hành trình (Khối nổi bật) */}
        {nextRecipe ? (
          <section className={styles.featuredBox} aria-label={t('dashboard.continueJourney')}>
            <header className={styles.sectionHeading}>
              <h2 className={styles.sectionTitle}>
                <span aria-hidden>🧭</span>
                <span>{t('dashboard.continueJourney')}</span>
              </h2>
              <p className={styles.sectionSubtitle}>{t('dashboard.continueJourneySubtitle')}</p>
            </header>

            <div className={styles.journeyCard}>
              <div className={styles.journeyImageWrap}>
                <ImageWithFallback
                  src={nextRecipe.image}
                  alt={nextRecipe.name}
                  fallbackTitle={nextRecipe.name}
                  className={styles.journeyImage}
                />
              </div>

              <div className={styles.journeyBody}>
                <div className={styles.journeyDetails}>
                  <span className={styles.journeyCategory}>
                    {dict.recipe.categoryLabels[nextRecipe.category] ?? nextRecipe.category}
                  </span>
                  <h3 className={styles.journeyName}>{nextRecipe.name}</h3>

                  <div className={styles.journeyMeta}>
                    <span>
                      {t('dashboard.difficulty')}:{' '}
                      <span className={styles.journeyStars}>
                        {'★'.repeat(nextRecipe.difficulty)}
                        {'☆'.repeat(5 - nextRecipe.difficulty)}
                      </span>
                    </span>
                    <span>•</span>
                    <span>
                      {t('dashboard.time')}: {formatDuration(nextRecipe.duration)}
                    </span>
                    <span>•</span>
                    <span
                      className={`${styles.journeyStatusTag} ${
                        isNextRecipeCooked ? styles.journeyStatusTagSuccess : ''
                      }`}
                    >
                      {isNextRecipeCooked
                        ? t('dashboard.bestScore', { score: nextRecipeBestScore } as Record<string, unknown>)
                        : t('dashboard.notCookedYet')}
                    </span>
                  </div>
                </div>

                <div className={styles.journeyActions}>
                  <Button variant="primary" onClick={handleCookNow}>
                    🍳 {t('dashboard.cookThisDish')}
                  </Button>
                  <Link to={`/recipes/${nextRecipe.id}`}>
                    <Button variant="secondary">{t('common.details')}</Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* 4. Gợi ý theo mùa/chủ đề */}
        {themeRecipes.length > 0 ? (
          <section className={styles.themeSection} aria-label={t('dashboard.themeTitle')}>
            <header className={styles.sectionHeading}>
              <h2 className={styles.sectionTitle}>
                <span aria-hidden>👑</span>
                <span>{t('dashboard.themeTitle')}</span>
              </h2>
              <p className={styles.sectionSubtitle}>{t('dashboard.themeSubtitle')}</p>
            </header>

            <div className={styles.recipeGrid}>
              {themeRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </section>
        ) : null}

        {/* 5. Hai cột: Thành tích sắp đạt & Bảng vinh danh mini */}
        <section className={styles.twoColGrid}>
          {/* Cột trái: Thành tích sắp đạt */}
          <div className={styles.panelBox}>
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderLeft}>
                <h3 className={styles.panelTitle}>
                  <span aria-hidden>🎯</span>
                  <span>{t('dashboard.nearAchievementsTitle')}</span>
                </h3>
                <span className={styles.panelSubtitle}>{t('dashboard.nearAchievementsSubtitle')}</span>
              </div>
              <Link to="/achievements" className={styles.viewAllLink}>
                {t('dashboard.viewAllLeaderboard')} →
              </Link>
            </div>

            {nearAchievements.length === 0 ? (
              <p className={styles.sectionSubtitle}>{t('dashboard.allAchievementsUnlocked')}</p>
            ) : (
              <div className={styles.achievementList}>
                {nearAchievements.map(({ achievement, pct }) => (
                  <div key={achievement.id} className={styles.achievementItem}>
                    <AchievementIcon
                      badgeId={achievement.id}
                      category={achievement.category}
                      size="sm"
                    />
                    <div className={styles.achievementInfo}>
                      <div className={styles.achievementName}>{achievement.name}</div>
                      <div className={styles.achievementDesc}>{achievement.description}</div>
                      <div className={styles.progressBarTrack} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                        <div className={styles.progressBarFill} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className={styles.achievementPct}>{pct}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cột phải: Bảng vinh danh mini */}
          <div className={styles.panelBox}>
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderLeft}>
                <h3 className={styles.panelTitle}>
                  <span aria-hidden>🏆</span>
                  <span>{t('dashboard.miniLeaderboardTitle')}</span>
                </h3>
                <span className={styles.panelSubtitle}>{t('dashboard.miniLeaderboardSubtitle')}</span>
              </div>
              <Link to="/leaderboard" className={styles.viewAllLink}>
                {t('dashboard.viewAllLeaderboard')} →
              </Link>
            </div>

            <div className={styles.leaderboardList}>
              {topThreeChefs.map((chef, idx) => {
                const isMe = chef.id === user?.id;
                return (
                  <div
                    key={chef.id}
                    className={`${styles.leaderboardItem} ${
                      isMe ? styles.leaderboardItemHighlight : ''
                    }`}
                  >
                    <span className={styles.rankBadge}>{getRankMedal(idx)}</span>

                    {chef.avatar ? (
                      <img src={chef.avatar} alt={chef.name} className={styles.leaderboardAvatar} />
                    ) : (
                      <div className={styles.leaderboardAvatarInitials}>
                        {chef.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className={styles.leaderboardName}>
                      {chef.name}
                      {isMe ? ` ${t('dashboard.you')}` : ''}
                    </div>

                    <div className={styles.leaderboardScore}>
                      {chef.totalScore.toLocaleString()} {t('dashboard.pts')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. Lịch sử bếp gần đây */}
        <section className={styles.historySection} aria-label={t('dashboard.recentHistoryTitle')}>
          <header className={styles.sectionHeading}>
            <h2 className={styles.sectionTitle}>
              <span aria-hidden>📜</span>
              <span>{t('dashboard.recentHistoryTitle')}</span>
            </h2>
            <p className={styles.sectionSubtitle}>{t('dashboard.recentHistorySubtitle')}</p>
          </header>

          {recentCookedHistory.length === 0 ? (
            <EmptyState
              title={t('dashboard.emptyHistoryTitle')}
              description={t('dashboard.emptyHistoryDesc')}
              action={
                <Link to="/recipes">
                  <Button variant="primary">{t('dashboard.emptyHistoryAction')}</Button>
                </Link>
              }
            />
          ) : (
            <div className={styles.historyList}>
              {recentCookedHistory.map((entry, idx) => (
                <div key={`${entry.recipeId}-${idx}-${entry.cookedAt}`} className={styles.historyItem}>
                  <div className={styles.historyItemLeft}>
                    <ImageWithFallback
                      src={entry.image}
                      alt={entry.recipeName}
                      fallbackTitle={entry.recipeName}
                      className={styles.historyThumb}
                    />
                    <div className={styles.historyDishInfo}>
                      <span className={styles.historyDishName}>{entry.recipeName}</span>
                      <span className={styles.historyDishStars}>
                        {'★'.repeat(entry.stars)}
                        {'☆'.repeat(5 - entry.stars)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.historyItemRight}>
                    <span className={styles.historyScore}>
                      +{entry.score} {t('dashboard.pts')}
                    </span>
                    <span className={styles.historyDate}>{formatDate(entry.cookedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PlayerShell>
  );
}

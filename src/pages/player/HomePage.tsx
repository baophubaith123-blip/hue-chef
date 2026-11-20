import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AchievementIcon } from '@/components/AchievementIcon';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { NOI_NOI_FLAT, gameIcon } from '@/components/theme-d/game-assets';
import { dishArtFor } from '@/components/theme-d/dish-art';
import { WoodPanel } from '@/components/theme-d/WoodPanel';
import { useAchievements } from '@/contexts/AchievementContext';
import { useTaxonomy } from '@/contexts/TaxonomyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { SEED_ACHIEVEMENTS } from '@/data/achievements';
import type { Recipe } from '@/data/types';
import { loadUsers } from '@/features/auth/store';
import { CheckinPanel } from '@/features/events/components/CheckinPanel';
import { questDefById } from '@/features/events/lib/quests';
import { useEvents } from '@/features/events/store';
import { isRecipeOwned } from '@/features/recipes/lib/ownership';
import { SceneDishCard } from '@/features/recipes/components/SceneDishCard';
import { useNextRecipe } from '@/features/recipes/hooks/useNextRecipe';
import { formatDate, formatDuration } from '@/lib/format';
import { useTranslation } from '@/i18n/useTranslation';
import { SceneShell } from '@/pages/player/SceneShell';

import { GuestGate } from '@/pages/player/GuestGate';
import styles from '@/pages/player/HomePage.module.css';

export default function HomePage() {
  const { t, dict } = useTranslation();
  const { recipeCategoryLabel } = useTaxonomy();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getApprovedRecipes } = useRecipes();
  const { isUnlocked, getProgressPct, allAchievements } = useAchievements();
  const { nextRecipe, isCooked: isNextRecipeCooked, bestScore: nextRecipeBestScore } =
    useNextRecipe();
  const eventsState = useEvents(user?.id ?? null);

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

  // Equipped badge (looked up in the merged catalogue, so editor-created
  // achievements show too) — kept separate from the level-based title:
  // the Lv.1 title and the first achievement share a name, so the hero
  // must never present the level title as if it were an equipped badge.
  const equippedBadge = useMemo(() => {
    if (!user?.equippedAchievementId) return null;
    return allAchievements.find((a) => a.id === user.equippedAchievementId) ?? null;
  }, [user?.equippedAchievementId, allAchievements]);

  const chefTitle = useMemo(() => {
    if (level >= 7) return t('dashboard.titleGrandmaster');
    if (level >= 5) return t('dashboard.titleMaster');
    if (level >= 3) return t('dashboard.titleCook');
    return t('dashboard.titleNovice');
  }, [level, t]);

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
    const players = users.filter(
      (u) => u.role === 'player' && u.status !== 'banned' && !u.guest,
    );
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

  // Thematic suggestions: e.g. Bánh Huế or top 4 recipes
  const themeRecipes = useMemo(() => {
    const banhList = approvedRecipes.filter((r) => r.category === 'banh');
    if (banhList.length >= 3) return banhList.slice(0, 4);
    return approvedRecipes.slice(0, 4);
  }, [approvedRecipes]);

  // Featured row on the festival board: next dish first, then the
  // thematic suggestions, at most 4 cards.
  const featuredRecipes = useMemo(() => {
    const list: Recipe[] = [];
    if (nextRecipe) list.push(nextRecipe);
    for (const recipe of themeRecipes) {
      if (list.length >= 4) break;
      if (!list.some((r) => r.id === recipe.id)) list.push(recipe);
    }
    return list;
  }, [nextRecipe, themeRecipes]);

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

  // Today's real daily quests for the taped paper panel
  const dailyQuests = useMemo(() => eventsState?.daily?.quests ?? [], [eventsState]);

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
    <SceneShell active="home">
      <div className={styles.page}>
        {/* Vùng biển hiệu: biển gỗ lớn + thẻ giấy người chơi */}
        <section className={styles.signArea} aria-label={dict.dashboard.heroTitleHue}>
          <div className={styles.signWrap}>
                        <div className={styles.signText}>
              <span className={styles.signTitle}>Hue Chef</span>
              <span className={styles.signSub}>{dict.dashboard.heroTitleHue}</span>
            </div>
          </div>

          <div className={styles.playerTag}>
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
            <div className={styles.playerTagMeta}>
              <span className={styles.greeting}>
                {greeting}, <strong>{user?.name}</strong>
              </span>
              <span className={styles.titleTagText}>
                {equippedBadge ? `🏅 ${equippedBadge.name}` : `⭐ ${chefTitle}`}
              </span>
            </div>
            <div className={styles.playerTagExp}>
              <span className={styles.playerTagLevel}>Lv.{level}</span>
              <div
                className={styles.progressBarTrack}
                role="progressbar"
                aria-valuenow={expPct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className={styles.progressBarFill} style={{ width: `${expPct}%` }} />
              </div>
              <span className={styles.playerTagExpText}>
                {exp} / {maxExp} EXP
              </span>
            </div>
          </div>
        </section>

        {/* Lưới chính: bảng giấy cuộn + cột phải */}
        <div className={styles.mainGrid}>
          <div className={styles.leftCol}>
          <section className={styles.scrollBoard} aria-label={dict.scene.festivalTitle}>
            <div className={styles.festivalBanner}>
              <span className={styles.festivalLantern} aria-hidden="true">🏮</span>
              <h2 className={styles.festivalTitle}>{dict.scene.festivalTitle}</h2>
              <span className={styles.liveChip}>{dict.scene.festivalLive}</span>
              <span className={styles.festivalLantern} aria-hidden="true">🏮</span>
            </div>

            <span className={styles.featuredTag}>🍜 {dict.scene.featuredTag}</span>

            {featuredRecipes.length > 0 ? (
              <div className={styles.dishRow}>
                {featuredRecipes.map((recipe) => (
                  <div key={recipe.id} className={styles.dishCell}>
                    <SceneDishCard
                      recipe={recipe}
                      lockedPrice={isRecipeOwned(user, recipe) ? undefined : recipe.priceCoins}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            <div className={styles.boardActions}>
              <Button variant="primary" className={styles.boardPlayBtn} onClick={handleCookNow}>
                🔥 {dict.dashboard.heroPlayNow}
              </Button>
              <Link to="/recipes" className={styles.boardExploreBtn}>
                🍲 {dict.dashboard.heroExplore}
              </Link>
            </div>

            <img
              src={NOI_NOI_FLAT.wave}
              alt=""
              className={styles.boardNoiNoi}
              draggable={false}
            />
          </section>

        {/* Tiếp tục hành trình */}
        {nextRecipe ? (
          <WoodPanel
            title={t('dashboard.continueJourney')}
            titleLevel="h2"
            className={styles.woodPanel}
          >
            <p className={`${styles.sectionSubtitle} ${styles.introGap}`}>
              {t('dashboard.continueJourneySubtitle')}
            </p>

            <div className={styles.journeyCard}>
              <div className={styles.journeyImageWrap}>
                <img
                  src={dishArtFor(nextRecipe)}
                  alt={nextRecipe.name}
                  className={styles.journeyImage}
                />
              </div>

              <div className={styles.journeyBody}>
                <div className={styles.journeyDetails}>
                  <span className={styles.journeyCategory}>
                    {recipeCategoryLabel(nextRecipe.category)}
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
          </WoodPanel>
        ) : null}

          </div>

          <aside className={styles.sideCol}>
            {user?.guest ? (
              <div className={styles.guestGateWrap}>
                <GuestGate />
              </div>
            ) : (
              <>
            <Link to="/quests" className={styles.todayLink}>
              <WoodPanel title={dict.scene.todayTitle} titleLevel="h2">
              <p className={styles.todayHint}>{dict.scene.todayHint}</p>
              <ul className={styles.todayList}>
                {dailyQuests.map((instance) => {
                  const def = questDefById(instance.defId);
                  if (!def) return null;
                  const textFn = dict.events.quests.metricText[def.metric];
                  const done = instance.progress >= def.target;
                  return (
                    <li key={instance.defId} className={styles.todayItem}>
                      <span
                        className={`${styles.todayCheck} ${
                          instance.claimed || done ? styles.todayCheckDone : ''
                        }`}
                        aria-hidden="true"
                      >
                        {instance.claimed || done ? '✓' : ''}
                      </span>
                      <span className={styles.todayText}>
                        {textFn ? textFn(def.target) : instance.defId}
                        {instance.claimed ? (
                          <span className={styles.todayClaimed}>
                            {' '}
                            · ✓ {dict.events.quests.claimed}
                          </span>
                        ) : !done ? (
                          <span className={styles.todayProgress}>
                            {' '}
                            · {instance.progress}/{def.target}
                          </span>
                        ) : null}
                      </span>
                      <span className={styles.todayReward}>
                        {dict.events.quests.rewardLabel(def.rewardXu)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              </WoodPanel>
            </Link>

            <div className={styles.paperFrame}>
              <CheckinPanel />
            </div>
              </>
            )}
          </aside>
        </div>

        {/* Chế độ chơi nhanh (4 link) */}
        <WoodPanel
          title={dict.dashboard.quickModesTitle}
          titleLevel="h2"
          className={styles.woodPanel}
          bodyClassName={styles.quickModesGrid}
        >
            <Link to="/recipes" className={styles.quickModeCard}>
              <div className={styles.quickModeIcon} aria-hidden="true">
                {gameIcon('recipes') ? (
                  <img src={gameIcon('recipes')} alt="" className={styles.paintedIcon} />
                ) : (
                  '👨‍🍳'
                )}
              </div>
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
              <div className={styles.quickModeIcon} aria-hidden="true">
                {gameIcon('map') ? (
                  <img src={gameIcon('map')} alt="" className={styles.paintedIcon} />
                ) : (
                  '📍'
                )}
              </div>
              <div className={styles.quickModeInfo}>
                <h3 className={styles.quickModeName}>{dict.dashboard.modeJourney}</h3>
                <p className={styles.quickModeDesc}>{dict.dashboard.modeJourneyDesc}</p>
              </div>
              <span className={styles.quickModeArrow}>›</span>
            </Link>

            <Link to="/leaderboard" className={styles.quickModeCard}>
              <div className={styles.quickModeIcon} aria-hidden="true">
                {gameIcon('trophy') ? (
                  <img src={gameIcon('trophy')} alt="" className={styles.paintedIcon} />
                ) : (
                  '🏆'
                )}
              </div>
              <div className={styles.quickModeInfo}>
                <h3 className={styles.quickModeName}>{dict.dashboard.modeDuel}</h3>
                <p className={styles.quickModeDesc}>{dict.dashboard.modeDuelDesc}</p>
              </div>
              <span className={styles.quickModeArrow}>›</span>
            </Link>

            <Link to="/achievements" className={styles.quickModeCard}>
              <div className={styles.quickModeIcon} aria-hidden="true">
                {gameIcon('mystery') ? (
                  <img src={gameIcon('mystery')} alt="" className={styles.paintedIcon} />
                ) : (
                  '🎁'
                )}
              </div>
              <div className={styles.quickModeInfo}>
                <h3 className={styles.quickModeName}>{dict.dashboard.modeSpecialEvents}</h3>
                <p className={styles.quickModeDesc}>{dict.dashboard.modeSpecialEventsDesc}</p>
              </div>
              <span className={styles.quickModeArrow}>›</span>
            </Link>

            <Link to="/stall" className={styles.quickModeCard}>
              <div className={styles.quickModeIcon} aria-hidden="true">
                {gameIcon('stall') ? (
                  <img src={gameIcon('stall')} alt="" className={styles.paintedIcon} />
                ) : (
                  '🏪'
                )}
              </div>
              <div className={styles.quickModeInfo}>
                <h3 className={styles.quickModeName}>{dict.nav.stall}</h3>
                <p className={styles.quickModeDesc}>{dict.dashboard.modeStallDesc}</p>
              </div>
              <span className={styles.quickModeArrow}>›</span>
            </Link>
        </WoodPanel>

        {/* Thống kê nhanh (4 chỉ số) */}
        <section aria-label={t('dashboard.statLevel')}>
          <WoodPanel className={styles.woodPanel} bodyClassName={styles.statsGrid}>
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
          </WoodPanel>
        </section>

        {/* Thẻ sự kiện (quests / survival / mystery) */}
        <WoodPanel
          title={dict.events.homeCards.eventsTitle}
          titleLevel="h2"
          className={styles.woodPanel}
          bodyClassName={styles.eventsGrid}
        >
            <Link to="/quests" className={styles.eventCard}>
              <div className={styles.eventIcon} aria-hidden="true">
                {gameIcon('quest') ? (
                  <img src={gameIcon('quest')} alt="" className={styles.paintedIcon} />
                ) : (
                  '📜'
                )}
              </div>
              <div className={styles.eventInfo}>
                <h3 className={styles.eventName}>{dict.nav.quests}</h3>
                <p className={styles.eventDesc}>{dict.events.homeCards.questsCard}</p>
              </div>
              <span className={styles.eventArrow}>›</span>
            </Link>

            <Link to="/survival" className={styles.eventCard}>
              <div className={styles.eventIcon} aria-hidden="true">
                {gameIcon('survival') ? (
                  <img src={gameIcon('survival')} alt="" className={styles.paintedIcon} />
                ) : (
                  '🔥'
                )}
              </div>
              <div className={styles.eventInfo}>
                <h3 className={styles.eventName}>{dict.nav.survival}</h3>
                <p className={styles.eventDesc}>{dict.events.homeCards.survivalCard}</p>
              </div>
              <span className={styles.eventArrow}>›</span>
            </Link>

            <Link to="/mystery" className={styles.eventCard}>
              <div className={styles.eventIcon} aria-hidden="true">
                {gameIcon('mystery') ? (
                  <img src={gameIcon('mystery')} alt="" className={styles.paintedIcon} />
                ) : (
                  '🎁'
                )}
              </div>
              <div className={styles.eventInfo}>
                <h3 className={styles.eventName}>{dict.nav.mystery}</h3>
                <p className={styles.eventDesc}>{dict.events.homeCards.mysteryCard}</p>
              </div>
              <span className={styles.eventArrow}>›</span>
            </Link>
        </WoodPanel>

        {/* Hai cột: Thành tích sắp đạt & Bảng vinh danh mini */}
        <section className={styles.twoColGrid}>
          <WoodPanel
            title={t('dashboard.nearAchievementsTitle')}
            titleLevel="h3"
            className={styles.woodPanel}
          >
            <div className={styles.panelHeader}>
              <span className={styles.panelSubtitle}>{t('dashboard.nearAchievementsSubtitle')}</span>
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
          </WoodPanel>

          <WoodPanel
            title={t('dashboard.miniLeaderboardTitle')}
            titleLevel="h3"
            className={styles.woodPanel}
          >
            <div className={styles.panelHeader}>
              <span className={styles.panelSubtitle}>{t('dashboard.miniLeaderboardSubtitle')}</span>
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
          </WoodPanel>
        </section>

        {/* Lịch sử bếp gần đây */}
        <WoodPanel
          title={t('dashboard.recentHistoryTitle')}
          titleLevel="h2"
          className={styles.woodPanel}
        >
          <p className={`${styles.sectionSubtitle} ${styles.introGap}`}>
            {t('dashboard.recentHistorySubtitle')}
          </p>

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
                    <img
                      src={dishArtFor({ id: entry.recipeId, image: entry.image })}
                      alt={entry.recipeName}
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
        </WoodPanel>
      </div>
    </SceneShell>
  );
}

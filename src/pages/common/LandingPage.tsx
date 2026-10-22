import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { getDefaultPathForRole } from '@/features/auth/types';
import { RecipeCard } from '@/features/recipes/components/RecipeCard';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/pages/common/LandingPage.module.css';

export default function LandingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { recipes } = useRecipes();

  // Pick top 3-4 featured recipes for the landing page showcase
  const featuredRecipes = useMemo(() => {
    const list = recipes.filter((r) => r.status === 'approved' || !r.status);
    return list.slice(0, 4);
  }, [recipes]);

  const handleStartCooking = () => {
    if (user) {
      navigate(getDefaultPathForRole(user.role));
    } else {
      navigate('/login');
    }
  };

  const handleScrollToFeatured = () => {
    const el = document.getElementById('featured-recipes');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.landing}>
      <Header />

      <main className={styles.main}>
        {/* 1. Hero Section */}
        <section className={styles.hero} aria-label="Hero">
          <div className={styles.heroContainer}>
            <div className={styles.heroContent}>
              <div className={styles.badgeTag}>
                <span aria-hidden="true">🏮</span>
                <span>{t('landing.steamText')}</span>
              </div>

              <h1 className={styles.heroTitle}>
                {t('landing.heroTitle')}
              </h1>

              <p className={styles.heroSubtitle}>
                {t('landing.heroSubtitle')}
              </p>

              <div className={styles.heroActions}>
                <Button variant="primary" onClick={handleStartCooking}>
                  {t('landing.ctaStart')}
                </Button>
                <Button variant="secondary" onClick={handleScrollToFeatured}>
                  {t('landing.ctaExplore')}
                </Button>
              </div>
            </div>

            <div className={styles.heroVisual} aria-hidden="true">
              <span className={`${styles.floatingEmoji} ${styles.emoji1}`}>🦐</span>
              <span className={`${styles.floatingEmoji} ${styles.emoji2}`}>🌾</span>
              <span className={`${styles.floatingEmoji} ${styles.emoji3}`}>🌶️</span>
              <span className={`${styles.floatingEmoji} ${styles.emoji4}`}>🫙</span>

              <div className={styles.bowlContainer}>
                <div className={styles.steamWrap}>
                  <span className={styles.steamWisp}>♨️</span>
                  <span className={styles.steamWisp}>♨️</span>
                  <span className={styles.steamWisp}>♨️</span>
                </div>
                <div className={styles.bowlGraphic}>🍜</div>
                <div className={styles.bowlGlow} />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Featured Recipes Section */}
        <section id="featured-recipes" className={styles.section} aria-label={t('landing.featuredTitle')}>
          <div className={styles.sectionContainer}>
            <header className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{t('landing.featuredTitle')}</h2>
              <p className={styles.sectionSubtitle}>{t('landing.featuredSubtitle')}</p>
            </header>

            <div className={styles.recipesGrid}>
              {featuredRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </div>
        </section>

        {/* 3. How to play Section */}
        <section className={`${styles.section} ${styles.sectionAlt}`} aria-label={t('landing.howToPlayTitle')}>
          <div className={styles.sectionContainer}>
            <header className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{t('landing.howToPlayTitle')}</h2>
              <p className={styles.sectionSubtitle}>{t('landing.howToPlaySubtitle')}</p>
            </header>

            <div className={styles.stepsGrid}>
              <div className={styles.stepCard}>
                <div className={styles.stepBadge}>🍲</div>
                <h3 className={styles.stepTitle}>{t('landing.step1Title')}</h3>
                <p className={styles.stepDesc}>{t('landing.step1Desc')}</p>
              </div>

              <div className={styles.stepCard}>
                <div className={styles.stepBadge}>🎮</div>
                <h3 className={styles.stepTitle}>{t('landing.step2Title')}</h3>
                <p className={styles.stepDesc}>{t('landing.step2Desc')}</p>
              </div>

              <div className={styles.stepCard}>
                <div className={styles.stepBadge}>⭐</div>
                <h3 className={styles.stepTitle}>{t('landing.step3Title')}</h3>
                <p className={styles.stepDesc}>{t('landing.step3Desc')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. 4 Roles Section */}
        <section className={styles.section} aria-label={t('landing.rolesTitle')}>
          <div className={styles.sectionContainer}>
            <header className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{t('landing.rolesTitle')}</h2>
              <p className={styles.sectionSubtitle}>{t('landing.rolesSubtitle')}</p>
            </header>

            <div className={styles.rolesGrid}>
              {/* Player */}
              <div className={styles.roleCard} tabIndex={0} role="region" aria-label={t('landing.rolePlayerTitle')}>
                <div className={styles.roleCardInner}>
                  <div className={styles.roleCardFront}>
                    <div className={styles.roleIcon}>👨‍🍳</div>
                    <h3 className={styles.roleTitle}>{t('landing.rolePlayerTitle')}</h3>
                    <span className={styles.roleHint}>{t('landing.roleHint')}</span>
                  </div>
                  <div className={styles.roleCardBack}>
                    <h3 className={styles.roleTitle}>{t('landing.rolePlayerTitle')}</h3>
                    <p className={styles.roleDesc}>{t('landing.rolePlayerDesc')}</p>
                  </div>
                </div>
              </div>

              {/* Editor */}
              <div className={styles.roleCard} tabIndex={0} role="region" aria-label={t('landing.roleEditorTitle')}>
                <div className={styles.roleCardInner}>
                  <div className={styles.roleCardFront}>
                    <div className={styles.roleIcon}>📝</div>
                    <h3 className={styles.roleTitle}>{t('landing.roleEditorTitle')}</h3>
                    <span className={styles.roleHint}>{t('landing.roleHint')}</span>
                  </div>
                  <div className={styles.roleCardBack}>
                    <h3 className={styles.roleTitle}>{t('landing.roleEditorTitle')}</h3>
                    <p className={styles.roleDesc}>{t('landing.roleEditorDesc')}</p>
                  </div>
                </div>
              </div>

              {/* Admin */}
              <div className={styles.roleCard} tabIndex={0} role="region" aria-label={t('landing.roleAdminTitle')}>
                <div className={styles.roleCardInner}>
                  <div className={styles.roleCardFront}>
                    <div className={styles.roleIcon}>🛡️</div>
                    <h3 className={styles.roleTitle}>{t('landing.roleAdminTitle')}</h3>
                    <span className={styles.roleHint}>{t('landing.roleHint')}</span>
                  </div>
                  <div className={styles.roleCardBack}>
                    <h3 className={styles.roleTitle}>{t('landing.roleAdminTitle')}</h3>
                    <p className={styles.roleDesc}>{t('landing.roleAdminDesc')}</p>
                  </div>
                </div>
              </div>

              {/* Support */}
              <div className={styles.roleCard} tabIndex={0} role="region" aria-label={t('landing.roleSupportTitle')}>
                <div className={styles.roleCardInner}>
                  <div className={styles.roleCardFront}>
                    <div className={styles.roleIcon}>💬</div>
                    <h3 className={styles.roleTitle}>{t('landing.roleSupportTitle')}</h3>
                    <span className={styles.roleHint}>{t('landing.roleHint')}</span>
                  </div>
                  <div className={styles.roleCardBack}>
                    <h3 className={styles.roleTitle}>{t('landing.roleSupportTitle')}</h3>
                    <p className={styles.roleDesc}>{t('landing.roleSupportDesc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Stats Section */}
        <section className={`${styles.section} ${styles.sectionAlt}`} aria-label={t('landing.statsTitle')}>
          <div className={styles.sectionContainer}>
            <header className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{t('landing.statsTitle')}</h2>
            </header>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🍲</div>
                <div className={styles.statText}>{t('landing.statRecipes')}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🌾</div>
                <div className={styles.statText}>{t('landing.statIngredients')}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🎖️</div>
                <div className={styles.statText}>{t('landing.statAchievements')}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>👨‍🍳</div>
                <div className={styles.statText}>{t('landing.statCooks')}</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

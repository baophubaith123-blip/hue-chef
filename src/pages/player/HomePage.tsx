import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { useTranslation } from '@/i18n/useTranslation';
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from '@/pages/player/HomePage.module.css';

export default function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { getApprovedRecipes } = useRecipes();

  const recipeCount = getApprovedRecipes().length;
  const appName = import.meta.env.VITE_APP_NAME;
  const appVersion = import.meta.env.VITE_APP_VERSION;

  return (
    <PlayerShell>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {t('home.welcome', { name: user?.name ?? t('home.playerHome') } as Record<string, unknown>)}
          </h1>
          <p className={styles.subtitle}>
            {t('home.introBody', { appName, version: appVersion } as Record<string, unknown>)}
          </p>
        </div>
      </header>
      <Card title={t('home.introTitle')}>
        <p>{t('home.browseIntro', { count: recipeCount } as Record<string, unknown>)}</p>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>{t('home.level')}</span>
            <span className={styles.statValue}>{user?.level ?? 1}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>{t('home.exp')}</span>
            <span className={styles.statValue}>
              {user?.exp ?? 0}/{user?.maxExp ?? 1000}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>{t('home.recipes')}</span>
            <span className={styles.statValue}>{recipeCount}</span>
          </div>
        </div>
        <div className={styles.actions}>
          <Link to="/recipes">
            <Button>{t('home.browseRecipes')}</Button>
          </Link>
        </div>
      </Card>
    </PlayerShell>
  );
}

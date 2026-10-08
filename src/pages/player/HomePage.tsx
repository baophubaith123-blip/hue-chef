import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from '@/pages/player/HomePage.module.css';

export default function HomePage() {
  const { user } = useAuth();
  const { getApprovedRecipes } = useRecipes();

  const recipeCount = getApprovedRecipes().length;

  return (
    <PlayerShell>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome, {user?.name ?? 'Chef'}</h1>
          <p className={styles.subtitle}>
            {import.meta.env.VITE_APP_NAME} v{import.meta.env.VITE_APP_VERSION}
          </p>
        </div>
      </header>
      <Card title="Player home">
        <p>
          Browse {recipeCount} Hue dishes, learn each recipe, then drag ingredients into the pot
          before time runs out.
        </p>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Level</span>
            <span className={styles.statValue}>{user?.level ?? 1}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>EXP</span>
            <span className={styles.statValue}>
              {user?.exp ?? 0}/{user?.maxExp ?? 1000}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Recipes</span>
            <span className={styles.statValue}>{recipeCount}</span>
          </div>
        </div>
        <div className={styles.actions}>
          <Link to="/recipes">
            <Button>Browse recipes</Button>
          </Link>
        </div>
      </Card>
    </PlayerShell>
  );
}

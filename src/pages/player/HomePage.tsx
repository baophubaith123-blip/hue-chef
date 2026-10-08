import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { SEED_RECIPES } from '@/data/recipes';

import styles from '@/pages/player/HomePage.module.css';

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome, {user?.name ?? 'Chef'}</h1>
          <p className={styles.subtitle}>
            {import.meta.env.VITE_APP_NAME} v{import.meta.env.VITE_APP_VERSION}
          </p>
        </div>
        <Button variant="secondary" onClick={logout}>
          Sign out
        </Button>
      </header>
      <Card title="Player home">
        <p>
          Hue cooking adventures start here. Phase 1 includes seed data for{' '}
          {SEED_RECIPES.length} classic dishes — recipes and cooking gameplay arrive in Phase 2.
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
            <span className={styles.statLabel}>Role</span>
            <span className={styles.statValue}>{user?.role ?? 'player'}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

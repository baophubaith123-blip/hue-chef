import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';

import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';

import styles from '@/pages/player/PlayerShell.module.css';

interface PlayerShellProps {
  children: ReactNode;
}

export function PlayerShell({ children }: PlayerShellProps) {
  const { user, logout } = useAuth();

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Link className={styles.brand} to="/">
          {import.meta.env.VITE_APP_NAME}
        </Link>
        <nav className={styles.nav} aria-label="Player">
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            to="/"
            end
          >
            Home
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            to="/recipes"
          >
            Recipes
          </NavLink>
          <span className={styles.navLink}>{user?.name}</span>
          <Button variant="secondary" onClick={logout}>
            Sign out
          </Button>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}

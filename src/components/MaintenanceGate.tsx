import { useEffect, useReducer, type ReactNode } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import type { AdminSettings } from '@/features/admin/types';
import { useTranslation } from '@/i18n/useTranslation';
import { getJsonStorage, STORAGE_KEYS } from '@/lib/storage';

import styles from '@/components/MaintenanceGate.module.css';

/**
 * When the admin switches maintenance mode on, every non-admin visitor sees
 * this screen instead of the app. Admins (and the login page itself, so an
 * admin can still sign in) pass through untouched.
 */
export function MaintenanceGate({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { dict } = useTranslation();
  const [, refresh] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  const settings = getJsonStorage<AdminSettings>(STORAGE_KEYS.adminSettings);
  const active = settings?.maintenanceMode === true;
  const onLoginPage = window.location.pathname === '/login';

  if (!active || user?.role === 'admin' || onLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.icon}>🛠️</div>
        <h1 className={styles.title}>{dict.maintenance.title}</h1>
        <p className={styles.body}>{dict.maintenance.body}</p>
        <div className={styles.actions}>
          <a className={styles.loginLink} href="/login">
            {dict.maintenance.adminLogin}
          </a>
          {user ? (
            <button type="button" className={styles.logoutBtn} onClick={logout}>
              {dict.auth.logout}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

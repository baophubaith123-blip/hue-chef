import type { MouseEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/components/NotificationBell.module.css';

export function NotificationBell() {
  const { user } = useAuth();
  const { listForUser, unreadCount, markRead, markAllReadForUser } = useNotification();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const count = useMemo(() => (user ? unreadCount(user.id) : 0), [user, unreadCount]);
  const notifs = useMemo(() => (user ? listForUser(user.id).slice(0, 10) : []), [user, listForUser]);

  const toggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleBellClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    toggle();
  };

  const handleNotifClick = (notifId: string, readAt?: string) => {
    if (!readAt) {
      markRead(notifId);
    }
  };

  const handleMarkAll = () => {
    if (!user) return;
    markAllReadForUser(user.id);
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.bellBtn}
        onClick={handleBellClick}
        aria-label={t('notifications.bellAria')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={styles.bellIcon} aria-hidden="true">
          🔔
        </span>
        {count > 0 ? (
          <span className={styles.badge} aria-label={t('notifications.unreadCount', { n: count })}>
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className={styles.dropdown} role="listbox">
          <header className={styles.dropdownHeader}>
            <span className={styles.dropdownTitle}>{t('nav.inbox')}</span>
            {count > 0 ? (
              <Button variant="ghost" className={styles.markAllBtn} onClick={handleMarkAll}>
                {t('notifications.markAllRead')}
              </Button>
            ) : null}
          </header>
          <div className={styles.dropdownBody}>
            {notifs.length === 0 ? (
              <p className={styles.empty}>{t('notifications.empty')}</p>
            ) : (
              <ul className={styles.list}>
                {notifs.map((n) => {
                  const isUnread = !n.readAt;
                  return (
                    <li
                      key={n.id}
                      role="option"
                      className={`${styles.item} ${isUnread ? styles.itemUnread : ''}`}
                      onClick={() => handleNotifClick(n.id, n.readAt)}
                    >
                      <div className={styles.itemContent}>
                        <div className={styles.itemTitle}>{n.title}</div>
                        <div className={styles.itemBody}>{n.body}</div>
                        <div className={styles.itemTime}>
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

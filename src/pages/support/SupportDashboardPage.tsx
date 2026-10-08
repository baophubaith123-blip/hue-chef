import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { AppealList } from '@/features/support/components/AppealList';
import { useAppeals } from '@/contexts/AppealContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSupport } from '@/contexts/SupportContext';
import { useTranslation } from '@/i18n/useTranslation';
import { SupportShell } from '@/pages/support/SupportShell';

import styles from '@/pages/support/SupportDashboardPage.module.css';

export default function SupportDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { listAppeals } = useAppeals();
  const { listThreadsForSupport, findUserById } = useSupport();

  const allAppeals = useMemo(() => listAppeals(), [listAppeals]);
  const openAppeals = allAppeals.filter((a) => a.status === 'open');
  const recommendedAppeals = allAppeals.filter((a) => a.status === 'recommended');
  const resolvedAppeals = allAppeals.filter((a) => a.status === 'resolved');
  const threads = useMemo(() => (user?.id ? listThreadsForSupport() : []), [listThreadsForSupport, user?.id]);
  const activeThreads = threads.filter((th) => !th.closed);

  const stats = [
    { label: t('support.statActiveChats'), value: activeThreads.length, accent: false },
    { label: t('support.statOpenAppeals'), value: openAppeals.length, accent: true },
    { label: t('appeal.recommended'), value: recommendedAppeals.length, accent: false },
    { label: t('support.statResolvedAppeals'), value: resolvedAppeals.length, accent: false },
  ];

  return (
    <SupportShell>
      <div className={styles.wrap}>
        <header className={styles.intro}>
          <h1 className={styles.title}>{t('support.dashboardTitle')}</h1>
          <p className={styles.greeting}>
            👋 {t('admin.dashboardGreeting')}{' '}
            <strong>{user?.name ?? t('roles.support')}</strong>
          </p>
          <p className={styles.introText}>{t('support.dashboardIntro')}</p>
        </header>

        <section className={styles.stats}>
          {stats.map((s) => (
            <div
              key={s.label}
              className={`${styles.stat} ${s.accent ? styles.statAccent : ''}`}
            >
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </section>

        <div className={styles.gridTwo}>
          <Card title={t('support.recentChats')}>
            {activeThreads.length === 0 ? (
              <p className={styles.muted}>{t('support.chatEmpty')}</p>
            ) : (
              <ul className={styles.threadList}>
                {activeThreads.slice(0, 6).map((th) => {
                  const otherId = th.participantIds.find((id) => id !== user?.id) ?? th.participantIds[0];
                  const other = findUserById(otherId);
                  return (
                    <li key={th.id}>
                      <Link className={styles.threadLink} to={`/support/chat?threadId=${th.id}`}>
                        <span className={styles.threadAvatar}>
                          {(other?.name ?? '?').charAt(0)}
                        </span>
                        <span className={styles.threadInfo}>
                          <strong className={styles.threadSubject}>{th.subject}</strong>
                          <span className={styles.threadMeta}>
                            💬 {other?.name ?? otherId} · {new Date(th.lastMessageAt).toLocaleString()}
                          </span>
                        </span>
                        <span className={styles.chev}>›</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className={styles.actions}>
              <Button variant="primary" onClick={() => navigate('/support/chat')}>
                {t('support.openChats') ?? '💬 Mở cuộc trò chuyện'} →
              </Button>
            </div>
          </Card>

          <Card title={t('support.recentAppeals')}>
            <AppealList
              compact
              limit={5}
              onSelect={(id) => navigate(`/support/appeals/${id}`)}
            />
            <div className={styles.actions}>
              <Button variant="secondary" onClick={() => navigate('/support/appeals')}>
                {t('nav.appeals')} →
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </SupportShell>
  );
}

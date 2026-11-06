import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { SupportChat } from '@/features/support/components/SupportChat';
import { useAuth } from '@/contexts/AuthContext';
import { useSupport } from '@/contexts/SupportContext';
import { useTranslation } from '@/i18n/useTranslation';
import { isBanActive } from '@/features/auth/types';
import { SupportShell } from '@/pages/support/SupportShell';

import styles from '@/pages/support/SupportChatPage.module.css';

export default function SupportChatPage() {
  const { t, dict } = useTranslation();
  const { user } = useAuth();
  const {
    listThreadsByParticipant,
    listThreadsForSupport,
    findUserById,
    getOrCreateThreadWithSupport,
    getMessages,
    closeThread,
  } = useSupport();
  const [params] = useSearchParams();
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>(params.get('threadId') ?? undefined);
  const banned = user ? isBanActive(user) : false;

  useEffect(() => {
    const fromUrl = params.get('threadId');
    if (fromUrl) setActiveThreadId(fromUrl);
  }, [params]);

  const threads = useMemo(() => {
    if (!user) return [];
    if (user.role === 'support') return listThreadsForSupport();
    return listThreadsByParticipant(user.id);
  }, [listThreadsByParticipant, listThreadsForSupport, user]);

  const activeThread = threads.find((th) => th.id === activeThreadId);

  const startNewThread = () => {
    if (!user) return;
    if (user.role === 'support') return;
    const newThread = getOrCreateThreadWithSupport(
      user.id,
      user.role,
      'Chào hỗ trợ, tôi cần giúp đỡ về tài khoản.',
    );
    setActiveThreadId(newThread.id);
  };

  const content = (
    <div className={styles.wrap}>
      {banned && user ? (
        <div className={styles.banBanner}>
          🚫 <strong>{dict.ban.noticeTitle}</strong> — {dict.ban.reasonLabel}:{' '}
          {user.banReason ?? '-'} · {dict.ban.untilLabel}:{' '}
          {user.banUntil ?? dict.ban.permanent}. {dict.ban.noticeBody}
        </div>
      ) : null}
      <header className={styles.header}>
        <h1 className={styles.title}>💬 {t('support.chatTitle')}</h1>
        {user?.role !== 'support' && threads.length === 0 ? (
          <Button variant="primary" onClick={startNewThread}>
            + {t('common.new')} {t('nav.chat')}
          </Button>
        ) : null}
      </header>

      <div className={styles.layout}>
        <aside className={styles.threadListCol}>
          {threads.length === 0 ? (
            <EmptyState
              title={t('support.chatEmpty')}
              description={t('support.chatHint')}
              action={
                user?.role !== 'support' ? (
                  <Button variant="primary" onClick={startNewThread}>
                    💡 {t('common.new')} {t('nav.chat')}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className={styles.threadList}>
              {threads.map((th) => {
                const otherId =
                  th.participantIds.find((id) => id !== user?.id) ?? th.participantIds[0];
                const other = findUserById(otherId);
                const unread = user
                  ? getMessages(th.id).filter((m) => !m.read && m.senderId !== user.id).length
                  : 0;
                const isActive = activeThreadId === th.id;
                return (
                  <li key={th.id}>
                    <button
                      type="button"
                      className={`${styles.threadItem} ${isActive ? styles.threadItemActive : ''}`}
                      onClick={() => setActiveThreadId(th.id)}
                    >
                      <span className={styles.avatar}>
                        {(other?.name ?? '?').charAt(0).toUpperCase()}
                      </span>
                      <span className={styles.threadInfo}>
                        <strong className={styles.threadSubject}>{th.subject}</strong>
                        <span className={styles.threadMeta}>
                          {(other?.name ?? otherId).slice(0, 32)}
                          {th.closed ? (
                            <span className={styles.tagClosed}> • {t('support.threadClosed')}</span>
                          ) : null}
                        </span>
                        <span className={styles.threadMeta}>
                          {new Date(th.lastMessageAt).toLocaleString()}
                        </span>
                      </span>
                      {unread > 0 ? (
                        <span className={styles.unreadDot}>{unread}</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className={styles.chatCol}>
          {user?.role === 'support' && activeThread && !activeThread.closed ? (
            <div className={styles.chatActions}>
              <Button
                variant="secondary"
                onClick={() => user && closeThread(activeThread.id, user.id)}
              >
                🔒 {t('support.closeThread')}
              </Button>
            </div>
          ) : null}
          {activeThreadId ? (
            <SupportChat
              threadId={activeThreadId}
              showCreateAppeal={user?.role === 'support' || banned}
            />
          ) : (
            <Card>
              <EmptyState
                title={t('support.chatHint')}
                description={t('support.chatEmpty')}
                action={
                  user?.role !== 'support' ? (
                    <Button variant="primary" onClick={startNewThread}>
                      💬 {t('common.new')} {t('nav.chat')}
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          )}
        </section>
      </div>
    </div>
  );

  if (user?.role === 'support') {
    return <SupportShell>{content}</SupportShell>;
  }
  return content;
}

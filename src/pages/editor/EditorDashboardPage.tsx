import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Loading } from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';
import { useMail } from '@/contexts/MailContext';
import { useEditorRecipes } from '@/features/editor/hooks/useEditorRecipes';
import { useTranslation } from '@/i18n/useTranslation';
import { EditorShell } from '@/pages/editor/EditorShell';

import shellStyles from '@/pages/common/RoleShell.module.css';
import styles from '@/pages/editor/EditorDashboardPage.module.css';

export default function EditorDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { stats, isLoading } = useEditorRecipes();
  const { getInboxForUser, getUnreadCount, markAsRead } = useMail();

  const inbox = user ? getInboxForUser(user.id).slice(0, 5) : [];
  const unread = user ? getUnreadCount(user.id) : 0;
  const inboxLabel = unread ? `${t('editor.inbox')} (${unread})` : t('editor.inbox');

  return (
    <EditorShell>
      {isLoading ? <Loading label={t('common.loading')} /> : null}
      <Card title={`${t('editor.dashboardGreeting')}, ${user?.name ?? 'Editor'}`}>
        <p>{t('editor.dashboardIntro')}</p>
        <div className={styles.stats}>
          <Stat label={t('editor.statDraft')} value={stats.draft} tone="muted" />
          <Stat label={t('editor.statPending')} value={stats.pending} tone="warning" />
          <Stat label={t('editor.statApproved')} value={stats.approved} tone="success" />
          <Stat label={t('editor.statRejected')} value={stats.rejected} tone="danger" />
        </div>
        <div className={styles.actions}>
          <Link to="/editor/recipes/new">
            <Button>{t('nav.newRecipe')}</Button>
          </Link>
          <Link to="/editor/recipes">
            <Button variant="secondary">{t('nav.myRecipes')}</Button>
          </Link>
        </div>
      </Card>

      <Card title={inboxLabel}>
        {inbox.length === 0 ? (
          <p className={styles.muted}>{t('editor.inboxEmpty')}</p>
        ) : (
          <ul className={shellStyles.mailList}>
            {inbox.map((mail) => (
              <li
                key={mail.id}
                className={[shellStyles.mailItem, !mail.read ? shellStyles.mailUnread : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                <strong>{mail.subject}</strong>
                <p className={styles.mailBody}>{mail.body}</p>
                {mail.rejectionReason ? (
                  <p className={styles.mailReason}>
                    {t('common.reason')}: {mail.rejectionReason}
                  </p>
                ) : null}
                {!mail.read && user ? (
                  <Button variant="ghost" onClick={() => markAsRead(mail.id, user.id)}>
                    {t('common.markRead')}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </EditorShell>
  );
}

const TONE: Record<string, string> = {
  muted: 'var(--color-surface-muted)',
  warning: 'var(--color-warning-soft)',
  success: 'var(--color-success-soft)',
  danger: 'var(--color-danger-soft)',
};

const TONE_TEXT: Record<string, string> = {
  muted: 'var(--color-text-muted)',
  warning: 'var(--color-warning)',
  success: 'var(--color-success)',
  danger: 'var(--color-danger)',
};

function Stat({
  label,
  value,
  tone = 'muted',
}: {
  label: string;
  value: number;
  tone?: 'muted' | 'warning' | 'success' | 'danger';
}) {
  return (
    <div className={styles.stat} style={{ background: TONE[tone], borderColor: TONE_TEXT[tone] }}>
      <span className={styles.statLabel} style={{ color: TONE_TEXT[tone] }}>
        {label}
      </span>
      <span className={styles.statValue} style={{ color: TONE_TEXT[tone] }}>
        {value}
      </span>
    </div>
  );
}

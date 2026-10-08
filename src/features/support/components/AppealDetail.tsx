import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useAppeals } from '@/contexts/AppealContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMail } from '@/contexts/MailContext';
import { useSupport } from '@/contexts/SupportContext';
import type { AppealType, AppealStatus } from '@/features/support/types';
import { useTranslation } from '@/i18n/useTranslation';
import { AppError } from '@/lib/errors';

import styles from '@/features/support/components/AppealDetail.module.css';

interface AppealDetailProps {
  appealId: string;
  onBack?: () => void;
  onUpdated?: () => void;
}

export function AppealDetail({ appealId, onBack, onUpdated }: AppealDetailProps) {
  const { t, dict } = useTranslation();
  const { getAppeal, updateStatus } = useAppeals();
  const { findUserById } = useSupport();
  const { user } = useAuth();
  const { sendSupportMail, unbanUser, banUser, sendBanNoticeMail } = useMail();
  const [resolution, setResolution] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const appeal = useMemo(() => getAppeal(appealId), [appealId, getAppeal]);
  const appellant = appeal ? findUserById(appeal.appellantId) : undefined;
  const supportUser = appeal?.supportId ? findUserById(appeal.supportId) : undefined;

  if (!appeal) {
    return (
      <Card title={t('support.appealDetail')}>
        <p className={styles.errorText}>{t('errors.appealNotFound')}</p>
      </Card>
    );
  }

  const appealTypeLabel = dict.support.typeLabels[appeal.type as AppealType];
  const statusLabel = dict.appeal.statusLabels[appeal.status as AppealStatus];

  const canAct = user && (user.role === 'support' || user.role === 'admin');

  const handleAction = (event: FormEvent<HTMLFormElement>, nextStatus: AppealStatus) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      if (nextStatus !== 'open' && !resolution.trim()) {
        throw new AppError('Need resolution', 'REQUIRED');
      }
      const opts: {
        supportId?: string;
        adminId?: string;
        resolution?: string;
      } = { resolution: resolution.trim() || undefined };
      if (user?.role === 'support') opts.supportId = user.id;
      if (user?.role === 'admin') opts.adminId = user.id;

      const updated = updateStatus(appeal.id, nextStatus, opts);

      if (user?.role === 'admin') {
        if (nextStatus === 'resolved' && appeal.type === 'ban') {
          try {
            unbanUser(appeal.appellantId, user.id);
          } catch {
            // might not be banned, ignore
          }
        }
        if (nextStatus === 'rejected' && appeal.type === 'ban') {
          try {
            banUser(appeal.appellantId, 'Appeal rejected', undefined, user.id);
            sendBanNoticeMail(appeal.appellantId, 'Appeal rejected');
          } catch {
            // ignore
          }
        }
      }

      if (appellant) {
        sendSupportMail(
          appellant.id,
          `Kết quả khiếu nại: ${statusLabel}`,
          `Khiếu nại "${appeal.subject}" của bạn đã được xử lý.\nTrạng thái: ${dict.appeal.statusLabels[updated.status]}\n${updated.resolution ? `\nGiải pháp:\n${updated.resolution}` : ''}`,
          { appealId: appeal.id, threadId: appeal.threadId },
        );
      }

      setSuccess(
        nextStatus === 'recommended'
          ? t('support.appealCreated')
          : nextStatus === 'resolved'
            ? 'Đã giải quyết khiếu nại.'
            : 'Đã từ chối khiếu nại.',
      );
      setResolution('');
      onUpdated?.();
    } catch (err) {
      if (err instanceof AppError && err.code === 'REQUIRED') {
        setError('Vui lòng nhập giải thích cho quyết định của bạn.');
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.actionsRow}>
        {onBack ? (
          <Button variant="ghost" onClick={onBack}>
            {t('common.back')}
          </Button>
        ) : null}
      </div>

      <Card title={t('support.appealDetail')}>
        <header className={styles.header}>
          <div className={styles.titleWrap}>
            <h3 className={styles.title}>
              <span className={`${styles.typePill} ${styles[`type_${appeal.type}`]}`}>
                {appealTypeLabel}
              </span>
              {appeal.subject}
            </h3>
            <div className={styles.metaRow}>
              <span className={`${styles.statusPill} ${styles[`status_${appeal.status}`]}`}>
                {statusLabel}
              </span>
              <span className={styles.meta}>
                {t('common.createdAt')}: {new Date(appeal.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </header>

        <dl className={styles.infoGrid}>
          <dt>{t('support.colAppellant')}</dt>
          <dd>
            {appellant?.avatar ? (
              <img src={appellant.avatar} alt="" className={styles.miniAvatar} />
            ) : null}
            <strong>{appellant?.name ?? appeal.appellantId}</strong>
            <span className={styles.muted}> &lt;{appellant?.email ?? '-'}&gt;</span>
          </dd>
          <dt>Thread</dt>
          <dd>
            <Link to={`/support/chat?threadId=${appeal.threadId}`} className={styles.link}>
              Mở đoạn hội thoại →
            </Link>
          </dd>
          {supportUser ? (
            <>
              <dt>Hỗ trợ xử lý</dt>
              <dd>
                {supportUser.avatar ? (
                  <img src={supportUser.avatar} alt="" className={styles.miniAvatar} />
                ) : null}
                <strong>{supportUser.name}</strong>
              </dd>
            </>
          ) : null}
          <dt>{t('common.description')}</dt>
          <dd className={styles.summary}>{appeal.summary}</dd>
          {appeal.resolution ? (
            <>
              <dt>{t('appeal.resolution')}</dt>
              <dd className={styles.resolutionBox}>{appeal.resolution}</dd>
            </>
          ) : null}
        </dl>

        {canAct ? (
          <form
            className={styles.actionForm}
            onSubmit={(e) => handleAction(e, appeal.status === 'resolved' ? 'resolved' : 'recommended')}
          >
            <label className={styles.label} htmlFor="resolution">
              {t('common.reason')} / {t('appeal.resolution')}
            </label>
            <textarea
              id="resolution"
              className={styles.textarea}
              placeholder={t('support.resolutionPlaceholder')}
              rows={4}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
            />
            <div className={styles.buttons}>
              {appeal.status !== 'resolved' ? (
                <Button
                  type="submit"
                  onClick={(e) =>
                    ((e as unknown as { currentTarget: { form: { requestSubmit: () => void } } }).currentTarget.form.requestSubmit())
                  }
                  formAction="post"
                  variant="primary"
                  onClickCapture={(e) => {
                    e.preventDefault();
                    const ev = { ...e, preventDefault: () => {} } as unknown as FormEvent<HTMLFormElement>;
                    handleAction(ev, 'recommended');
                  }}
                >
                  {t('support.recommendToAdmin')}
                </Button>
              ) : null}
              {appeal.status !== 'resolved' ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={(e) => {
                    const ev = e as unknown as FormEvent<HTMLFormElement>;
                    handleAction(ev, 'rejected');
                  }}
                >
                  {t('support.rejectAppeal')}
                </Button>
              ) : null}
              {appeal.status !== 'resolved' && user?.role === 'admin' ? (
                <Button
                  type="button"
                  variant="primary"
                  className={styles.resolveBtn}
                  onClick={(e) => {
                    const ev = e as unknown as FormEvent<HTMLFormElement>;
                    handleAction(ev, 'resolved');
                  }}
                >
                  {t('appeal.resolved')}
                </Button>
              ) : null}
            </div>
          </form>
        ) : null}

        {error ? <div className={styles.bannerError}>{error}</div> : null}
        {success ? <div className={styles.bannerSuccess}>{success}</div> : null}
      </Card>
    </div>
  );
}

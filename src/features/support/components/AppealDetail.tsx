import { useMemo, useState } from 'react';
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
  const { sendSupportMail } = useMail();
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

  const isFinal = appeal.status === 'resolved' || appeal.status === 'rejected';
  const canAct = Boolean(user && user.role === 'support') && !isFinal;

  const handleAction = (nextStatus: AppealStatus) => {
    setError(null);
    setSuccess(null);
    try {
      if (!resolution.trim()) {
        throw new AppError('Need resolution', 'REQUIRED');
      }
      const updated = updateStatus(appeal.id, nextStatus, {
        supportId: user?.id,
        resolution: resolution.trim(),
      });

      if (appellant) {
        const newLabel = dict.appeal.statusLabels[updated.status];
        sendSupportMail(
          appellant.id,
          dict.support.appealMailSubject(newLabel),
          nextStatus === 'recommended'
            ? dict.support.appealMailRecommendedBody(updated.resolution)
            : dict.support.appealMailBody(newLabel, updated.resolution),
          { appealId: appeal.id, threadId: appeal.threadId },
        );
      }

      setSuccess(
        nextStatus === 'recommended'
          ? t('support.appealRecommended')
          : t('support.appealRejectedMsg'),
      );
      setResolution('');
      onUpdated?.();
    } catch (err) {
      if (err instanceof AppError && err.code === 'REQUIRED') {
        setError(t('support.resolutionRequired'));
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
          <dt>{t('support.threadLabel')}</dt>
          <dd>
            <Link to={`/support/chat?threadId=${appeal.threadId}`} className={styles.link}>
              {t('support.openThread')}
            </Link>
          </dd>
          {supportUser ? (
            <>
              <dt>{t('support.handledBy')}</dt>
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
            onSubmit={(e) => {
              e.preventDefault();
              handleAction('recommended');
            }}
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
              <Button type="submit" variant="primary">
                {t('support.recommendToAdmin')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => handleAction('rejected')}>
                {t('support.rejectAppeal')}
              </Button>
            </div>
          </form>
        ) : null}

        {error ? <div className={styles.bannerError}>{error}</div> : null}
        {success ? <div className={styles.bannerSuccess}>{success}</div> : null}
      </Card>
    </div>
  );
}

import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useMail, type BroadcastTarget } from '@/contexts/MailContext';
import { useTranslation } from '@/i18n/useTranslation';
import { AppError } from '@/lib/errors';
import { AdminShell } from '@/pages/admin/AdminShell';

import styles from '@/pages/admin/AdminBroadcastPage.module.css';

const TARGET_OPTIONS: Array<{ value: BroadcastTarget; labelKey: string; fallback: string }> = [
  { value: 'all', labelKey: 'nav.broadcast', fallback: 'Tất cả người dùng' },
  { value: 'player', labelKey: 'roles.player', fallback: 'Người chơi' },
  { value: 'editor', labelKey: 'roles.editor', fallback: 'Biên tập viên' },
  { value: 'support', labelKey: 'roles.support', fallback: 'Hỗ trợ' },
];

export default function AdminBroadcastPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { sendBroadcastMail } = useMail();

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<BroadcastTarget>('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ count: number } | null>(null);

  const hasContent = useMemo(
    () => subject.trim().length > 0 || body.trim().length > 0,
    [subject, body],
  );

  const prefixedSubject = useMemo(() => {
    const prefix = (t('mail.broadcastSubjectPrefix') as unknown as string) ?? '[Thông báo] ';
    return subject.trim() ? `${prefix}${subject.trim()}` : '';
  }, [subject, t]);

  const targetLabel = useMemo(() => {
    const opt = TARGET_OPTIONS.find((o) => o.value === target);
    if (!opt) return target;
    const translated = t(opt.labelKey) as unknown as string;
    return translated && translated !== opt.labelKey ? translated : opt.fallback;
  }, [target, t]);

  const handleSubjectChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSubject(e.target.value);
    setSuccess(null);
    setError(null);
  };

  const handleBodyChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value);
    setSuccess(null);
    setError(null);
  };

  const handleTargetChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setTarget(e.target.value as BroadcastTarget);
    setSuccess(null);
    setError(null);
  };

  const handleReset = () => {
    setSubject('');
    setBody('');
    setTarget('all');
    setSuccess(null);
    setError(null);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!user) return;
    try {
      const result = sendBroadcastMail(user.id, target, subject.trim(), body.trim());
      setSuccess({ count: result.count });
    } catch (err) {
      if (err instanceof AppError) {
        if (err.code === 'BROADCAST_EMPTY') {
          setError(t('mail.broadcastEmpty') as unknown as string);
        } else {
          setError(err.message);
        }
      } else {
        setError(String(err));
      }
    }
  };

  return (
    <AdminShell>
      <div className={styles.wrap}>
        <header className={styles.intro}>
          <h1 className={styles.title}>📣 {t('admin.broadcastTitle')}</h1>
          <p className={styles.introText}>{t('admin.broadcastIntro')}</p>
          <p className={styles.introText}>{t('broadcast.intro')}</p>
        </header>

        {success ? (
          <div className={styles.successBanner} role="status">
            <span>✅</span>
            <span>
              {(t('admin.broadcastSent', { count: success.count }) as unknown as string) ||
                `Đã gửi thư thông báo đến ${success.count} người dùng.`}
            </span>
          </div>
        ) : null}

        {error ? (
          <div className={styles.errorBanner} role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        ) : null}

        <div className={styles.grid}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <Card title={t('broadcast.title')}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="broadcast-target">
                  {t('admin.broadcastTarget')}
                </label>
                <select
                  id="broadcast-target"
                  className={styles.select}
                  value={target}
                  onChange={handleTargetChange}
                >
                  {TARGET_OPTIONS.map((opt) => {
                    const translated = t(opt.labelKey) as unknown as string;
                    const label =
                      translated && translated !== opt.labelKey ? translated : opt.fallback;
                    return (
                      <option key={opt.value} value={opt.value}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="broadcast-subject">
                  {t('admin.broadcastSubject')} <span aria-hidden="true">*</span>
                </label>
                <input
                  id="broadcast-subject"
                  type="text"
                  className={styles.input}
                  value={subject}
                  onChange={handleSubjectChange}
                  placeholder={t('mail.broadcastSubjectPrefix') as unknown as string}
                  maxLength={200}
                />
                <span className={styles.hint}>{subject.length}/200</span>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="broadcast-body">
                  {t('admin.broadcastBody')} <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id="broadcast-body"
                  className={styles.textarea}
                  value={body}
                  onChange={handleBodyChange}
                  placeholder="Nhập nội dung thông báo..."
                  maxLength={5000}
                />
                <span className={styles.hint}>{body.length}/5000</span>
              </div>

              <div className={styles.actions}>
                <Button type="button" variant="secondary" onClick={handleReset}>
                  {(t('common.reset') as unknown as string) === 'common.reset'
                    ? 'Làm lại'
                    : (t('common.reset') as unknown as string)}
                </Button>
                <Button type="submit" variant="primary">
                  📤 {t('common.send')}
                </Button>
              </div>
            </Card>
          </form>

          <Card
            title={
              <span>
                {t('admin.broadcastPreview')}
                <span className={styles.countBadge}>{targetLabel}</span>
              </span>
            }
          >
            <div className={styles.previewHeader}>
              <span className={styles.hint}>{t('admin.broadcastRecipients')}:</span>
            </div>
            {hasContent ? (
              <div>
                <p className={styles.previewSubject}>
                  {prefixedSubject || <em style={{ opacity: 0.5 }}>({t('mail.noSubject')})</em>}
                </p>
                <p className={styles.previewMeta}>
                  📢 {t('mail.typeLabels.broadcast')} · {new Date().toLocaleString()}
                </p>
                <p className={styles.previewBody}>
                  {body.trim() || (
                    <em style={{ opacity: 0.5 }}>
                      ({t('admin.broadcastBody')}...)
                    </em>
                  )}
                </p>
              </div>
            ) : (
              <p className={styles.emptyPreview}>
                ({t('inbox.empty')})
                <br />
                <span style={{ fontSize: '0.78rem' }}>{t('inbox.hint')}</span>
              </p>
            )}
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}

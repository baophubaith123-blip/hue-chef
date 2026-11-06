import { useRef, useState } from 'react';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import type { StoredUser } from '@/features/auth/types';
import type { Achievement, Recipe } from '@/data/types';
import type { AdminSettings } from '@/features/admin/types';
import { AppError } from '@/lib/errors';
import { useTranslation } from '@/i18n/useTranslation';
import { AdminShell } from '@/pages/admin/AdminShell';

import styles from '@/pages/admin/AdminBackupPage.module.css';

interface BackupPayload {
  users?: StoredUser[];
  recipes?: Recipe[];
  adminAchievements?: Achievement[];
  deletedAchievementIds?: string[];
  settings?: AdminSettings;
  timestamp?: string;
}

function describeError(err: unknown, fallback: string, invalidBackup: string): string {
  if (err instanceof AppError && err.code === 'INVALID_BACKUP') return invalidBackup;
  return err instanceof Error ? err.message : fallback;
}

export default function AdminBackupPage() {
  const { t, dict } = useTranslation();
  const { user } = useAuth();
  const admin = useAdmin();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleExport = () => {
    if (!user) return;
    try {
      const data = admin.exportAll(user);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `hue-chef-backup-${ts}.json`;
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setErrorMsg(null);
      setSuccessMsg(t('admin.exportJson') + ' ✓');
    } catch (err) {
      const msg = describeError(err, String(err), t('errors.backupInvalid'));
      setErrorMsg(msg);
      setSuccessMsg(null);
      window.alert(msg);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const confirmed = window.confirm(t('admin.backupImportConfirm'));
    if (!confirmed) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = String(reader.result ?? '');
        const parsed = JSON.parse(raw) as BackupPayload;
        const counts = admin.importAll(
          {
            users: parsed.users,
            recipes: parsed.recipes,
            adminAchievements: parsed.adminAchievements,
            deletedAchievementIds: parsed.deletedAchievementIds,
            settings: parsed.settings,
          },
          user,
        );
        setErrorMsg(null);
        setSuccessMsg(dict.admin.backupImported(counts.userCount, counts.recipeCount));
        window.setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        const msg = describeError(err, String(err), t('errors.backupInvalid'));
        setErrorMsg(msg);
        setSuccessMsg(null);
        window.alert(msg);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      const msg = t('errors.fileReadFailed');
      setErrorMsg(msg);
      setSuccessMsg(null);
      window.alert(msg);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <AdminShell>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.backupTitle')}</h1>
          <p className={styles.intro}>{t('admin.backupIntro')}</p>
        </div>
      </header>

      <Card>
        <div className={styles.actions}>
          <Button variant="primary" onClick={handleExport}>
            {t('admin.exportJson')}
          </Button>
          <Button variant="secondary" onClick={handleImportClick}>
            {t('admin.importJson')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className={styles.hiddenInput}
            onChange={handleFileChange}
          />
        </div>

        <div className={styles.warningBox}>
          <strong>{t('admin.backupWarning')}</strong>
        </div>

        {errorMsg ? <div className={styles.error} role="alert">{errorMsg}</div> : null}
        {successMsg ? <div className={styles.success} role="status">{successMsg}</div> : null}
      </Card>
      {void AppError}
    </AdminShell>
  );
}

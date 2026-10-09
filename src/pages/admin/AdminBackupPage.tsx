import { useRef, useState } from 'react';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import type { StoredUser } from '@/features/auth/types';
import type { Recipe } from '@/data/types';
import { AppError } from '@/lib/errors';
import { useTranslation } from '@/i18n/useTranslation';
import { AdminShell } from '@/pages/admin/AdminShell';

import styles from '@/pages/admin/AdminBackupPage.module.css';

interface BackupPayload {
  users?: StoredUser[];
  recipes?: Recipe[];
  timestamp?: string;
}

export default function AdminBackupPage() {
  const { t } = useTranslation();
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
      const msg = err instanceof Error ? err.message : String(err);
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
    const confirmed = window.confirm(
      'Warning: Import will overwrite current data. Continue?',
    );
    if (!confirmed) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = String(reader.result ?? '');
        const parsed = JSON.parse(raw) as BackupPayload;
        admin.importAll(
          { users: parsed.users, recipes: parsed.recipes },
          user,
        );
        setErrorMsg(null);
        setSuccessMsg(t('admin.importJson') + ' ✓');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMsg(msg);
        setSuccessMsg(null);
        window.alert(msg);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      const msg = 'Failed to read file';
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
          <strong>⚠ Warning:</strong> Import will overwrite current data — please confirm before importing.
        </div>

        {errorMsg ? <div className={styles.error} role="alert">{errorMsg}</div> : null}
        {successMsg ? <div className={styles.success} role="status">{successMsg}</div> : null}
      </Card>
      {void AppError}
    </AdminShell>
  );
}

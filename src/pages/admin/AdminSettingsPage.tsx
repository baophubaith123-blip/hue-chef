import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import type { AdminSettings } from '@/features/admin/types';
import { AppError } from '@/lib/errors';
import { useTranslation } from '@/i18n/useTranslation';
import { AdminShell } from '@/pages/admin/AdminShell';

import styles from '@/pages/admin/AdminSettingsPage.module.css';

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const admin = useAdmin();

  const [form, setForm] = useState<AdminSettings>(() => admin.getSettings());
  const [dirty, setDirty] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setForm(admin.getSettings());
  }, [admin]);

  const markDirty = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
    setForm((prev) => {
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
    setDirty(true);
    setSuccessMsg(null);
  };

  const handleNumber = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const num = Number(value);
    if (Number.isFinite(num)) {
      markDirty(name as keyof AdminSettings, num as AdminSettings[keyof AdminSettings]);
    }
  };

  const handleBool = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    markDirty(name as keyof AdminSettings, checked as AdminSettings[keyof AdminSettings]);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    try {
      admin.updateSettings(form, user);
      setDirty(false);
      setErrorMsg(null);
      setSuccessMsg(t('common.submit'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setSuccessMsg(null);
      window.alert(msg);
    }
  };

  return (
    <AdminShell>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.settingsTitle')}</h1>
          <p className={styles.intro}>{t('admin.settingsIntro')}</p>
        </div>
      </header>

      <Card>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="maxUploadMB" className={styles.label}>
              {t('admin.maxUploadMB')}
            </label>
            <input
              id="maxUploadMB"
              name="maxUploadMB"
              type="number"
              min={1}
              className={styles.input}
              value={form.maxUploadMB}
              onChange={handleNumber}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="afkTimeoutSeconds" className={styles.label}>
              {t('admin.afkTimeout')}
            </label>
            <input
              id="afkTimeoutSeconds"
              name="afkTimeoutSeconds"
              type="number"
              min={0}
              className={styles.input}
              value={form.afkTimeoutSeconds}
              onChange={handleNumber}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="autoBanAfterWarnings" className={styles.label}>
              {t('admin.autoBanWarnings')}
            </label>
            <input
              id="autoBanAfterWarnings"
              name="autoBanAfterWarnings"
              type="number"
              min={1}
              className={styles.input}
              value={form.autoBanAfterWarnings}
              onChange={handleNumber}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="maxRecipeScore" className={styles.label}>
              {t('admin.maxRecipeScore')}
            </label>
            <input
              id="maxRecipeScore"
              name="maxRecipeScore"
              type="number"
              min={1}
              className={styles.input}
              value={form.maxRecipeScore}
              onChange={handleNumber}
            />
          </div>

          <div className={styles.checkboxField}>
            <input
              id="maintenanceMode"
              name="maintenanceMode"
              type="checkbox"
              className={styles.checkbox}
              checked={form.maintenanceMode}
              onChange={handleBool}
            />
            <label htmlFor="maintenanceMode" className={styles.checkboxLabel}>
              {t('admin.maintenanceMode')}
            </label>
          </div>

          <div className={styles.formActions}>
            <Button type="submit" disabled={!dirty}>
              {t('common.save')}
            </Button>
          </div>

          {errorMsg ? <div className={styles.error} role="alert">{errorMsg}</div> : null}
          {successMsg ? <div className={styles.success} role="status">{successMsg}</div> : null}
        </form>
      </Card>
      {void AppError}
    </AdminShell>
  );
}

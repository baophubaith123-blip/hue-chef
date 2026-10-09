import { useMemo, useState, type ChangeEvent } from 'react';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { AuditLogTable } from '@/features/admin/components/AuditLogTable';
import type { AuditAction, AuditLogEntry } from '@/features/admin/types';
import { useTranslation } from '@/i18n/useTranslation';
import { AdminShell } from '@/pages/admin/AdminShell';
import type { PublicUser } from '@/features/auth/types';

import styles from '@/pages/admin/AdminAuditLogPage.module.css';

const ACTION_OPTIONS: AuditAction[] = [
  'user.create',
  'user.update',
  'user.ban',
  'user.unban',
  'user.delete',
  'user.warning',
  'recipe.approve',
  'recipe.reject',
  'recipe.delete',
  'achievement.create',
  'achievement.update',
  'achievement.delete',
  'achievement.unlock',
  'comment.delete',
  'report.resolve',
  'appeal.accept',
  'appeal.reject',
  'setting.update',
  'backup.export',
  'backup.import',
  'broadcast.send',
];

export default function AdminAuditLogPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const admin = useAdmin();

  const [actorId, setActorId] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const [applied, setApplied] = useState<{ actorId: string; action: string }>({ actorId: '', action: '' });

  void user;

  const users = useMemo(() => admin.listUsers(), [admin]);
  const userMap = useMemo(() => {
    const map: Record<string, PublicUser> = {};
    for (const u of users) map[u.id] = u;
    return map;
  }, [users]);

  const entries = useMemo<AuditLogEntry[]>(() => {
    const options: { action?: AuditAction; actorId?: string } = {};
    if (applied.action) options.action = applied.action as AuditAction;
    if (applied.actorId) options.actorId = applied.actorId;
    const list = admin.listAuditLog(options);
    return list.slice(0, 200);
  }, [admin, applied]);

  const handleActorChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setActorId(e.target.value);
  };

  const handleActionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setAction(e.target.value);
  };

  const applyFilter = () => {
    setApplied({ actorId, action });
  };

  const resetFilter = () => {
    setActorId('');
    setAction('');
    setApplied({ actorId: '', action: '' });
  };

  return (
    <AdminShell>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.auditLogTitle')}</h1>
          <p className={styles.intro}>{t('admin.auditLogIntro')}</p>
        </div>
      </header>

      <Card>
        <div className={styles.filterBar}>
          <div className={styles.filterField}>
            <label className={styles.label}>{t('admin.colActor')}</label>
            <select className={styles.input} value={actorId} onChange={handleActorChange}>
              <option value="">{t('common.all')}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterField}>
            <label className={styles.label}>{t('admin.colAction')}</label>
            <select className={styles.input} value={action} onChange={handleActionChange}>
              <option value="">{t('common.all')}</option>
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterActions}>
            <Button variant="primary" onClick={applyFilter}>
              {t('common.filter')}
            </Button>
            <Button variant="secondary" onClick={resetFilter}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        {entries.length === 0 ? (
          <EmptyState title={t('admin.auditLogTitle')} />
        ) : (
          <AuditLogTable entries={entries} userMap={userMap} />
        )}
      </Card>
    </AdminShell>
  );
}

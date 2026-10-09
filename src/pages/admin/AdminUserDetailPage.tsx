import { useMemo, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { AuditLogTable } from '@/features/admin/components/AuditLogTable';
import type { AuditLogEntry } from '@/features/admin/types';
import { AppError } from '@/lib/errors';
import { useTranslation } from '@/i18n/useTranslation';
import { AdminShell } from '@/pages/admin/AdminShell';
import type { PublicUser, UserRole } from '@/features/auth/types';

import styles from '@/pages/admin/AdminUserDetailPage.module.css';

const ROLE_OPTIONS: UserRole[] = ['player', 'support', 'editor', 'admin'];

export default function AdminUserDetailPage() {
  const { t, dict } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const admin = useAdmin();
  const navigate = useNavigate();
  const [refreshTick, setRefreshTick] = useState(0);

  const refresh = () => setRefreshTick((x) => x + 1);

  const target: PublicUser | null = useMemo(() => {
    if (!id) return null;
    return admin.getUser(id);
  }, [admin, id, refreshTick]);

  const userMap = useMemo(() => {
    const list = admin.listUsers();
    const map: Record<string, PublicUser> = {};
    for (const u of list) map[u.id] = u;
    return map;
  }, [admin, refreshTick]);

  const userAudit: AuditLogEntry[] = useMemo(() => {
    if (!id) return [];
    return admin.listAuditLog({ actorId: id }).slice(0, 200);
  }, [admin, id, refreshTick]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAudit, setShowAudit] = useState(false);

  if (!target) {
    return (
      <AdminShell>
        <Card>
          <EmptyState title={t('errors.userNotFound')} />
          <div className={styles.actions}>
            <Link to="/admin/users">
              <Button variant="secondary">{t('common.back')}</Button>
            </Link>
          </div>
        </Card>
      </AdminShell>
    );
  }

  const handleRoleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (!user) return;
    const nextRole = event.target.value as UserRole;
    try {
      admin.updateUser(target.id, { role: nextRole }, user);
      setErrorMsg(null);
      refresh();
    } catch (err) {
      const code = err instanceof AppError ? err.code : null;
      let msg = err instanceof Error ? err.message : String(err);
      if (code === 'LAST_ADMIN') msg = t('admin.cannotDemoteLastAdmin');
      setErrorMsg(msg);
      window.alert(msg);
      refresh();
    }
  };

  const handleToggleBan = () => {
    if (!user) return;
    try {
      if (target.status === 'banned') {
        admin.unbanUser(target.id, user);
      } else {
        const reason = window.prompt(t('admin.banReason')) ?? '';
        if (!reason.trim()) return;
        admin.banUser({ id: target.id, reason, until: 'permanent', actor: user });
      }
      setErrorMsg(null);
      refresh();
    } catch (err) {
      const code = err instanceof AppError ? err.code : null;
      let msg = err instanceof Error ? err.message : String(err);
      if (code === 'BAN_ADMIN') msg = t('admin.cannotBanAdmin');
      setErrorMsg(msg);
      window.alert(msg);
    }
  };

  const isBanned = target.status === 'banned';

  return (
    <AdminShell>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {t('admin.userDetail')}: {target.name}
          </h1>
          <p className={styles.intro}>{target.email}</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/admin/users')}>
            {t('common.back')}
          </Button>
        </div>
      </header>

      {errorMsg ? (
        <div className={styles.errorBanner} role="alert">
          {errorMsg}
        </div>
      ) : null}

      <Card>
        <div className={styles.profile}>
          <div className={styles.avatarWrap}>
            <img
              className={styles.avatar}
              src={target.avatar}
              alt={target.name}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
              }}
            />
          </div>
          <div className={styles.profileGrid}>
            <InfoRow label={t('admin.colName')} value={target.name} />
            <InfoRow label={t('admin.colEmail')} value={target.email} />
            <div>
              <div className={styles.infoLabel}>{t('admin.colRole')}</div>
              <select
                className={styles.roleSelect}
                value={target.role}
                onChange={handleRoleChange}
                aria-label={t('admin.changeRole')}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {dict.roles[r]}
                  </option>
                ))}
              </select>
            </div>
            <InfoRow
              label={t('common.status')}
              value={isBanned ? dict.roles.banned : dict.roles.player}
              tone={isBanned ? 'danger' : 'ok'}
            />
            <InfoRow label={t('admin.colCreatedAt')} value={new Date(target.createdAt).toLocaleString()} />
            <InfoRow label={t('admin.colWarningCount')} value={String(target.warningCount ?? 0)} />
            {target.role === 'player' ? (
              <>
                <InfoRow label="Level" value={`${target.level ?? 1}`} />
                <InfoRow label="EXP" value={`${target.exp ?? 0}/${target.maxExp ?? 1000}`} />
              </>
            ) : null}
            {target.role === 'editor' ? (
              <>
                <InfoRow label="Bio" value={target.bio ?? '-'} />
                <InfoRow label="Recipes" value={String(target.recipeCount ?? 0)} />
              </>
            ) : null}
          </div>
        </div>

        <div className={styles.actions}>
          <Button variant={isBanned ? 'primary' : 'secondary'} onClick={handleToggleBan}>
            {isBanned ? t('admin.unbanUser') : t('admin.banUser')}
          </Button>
          <Button variant="secondary" onClick={() => setShowAudit((s) => !s)}>
            {showAudit ? 'Hide audit log' : 'Xem audit log'}
          </Button>
        </div>
      </Card>

      {showAudit ? (
        <Card title="Audit log">
          <AuditLogTable entries={userAudit} userMap={userMap} />
        </Card>
      ) : null}
    </AdminShell>
  );
}

function InfoRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'ok' | 'danger';
}) {
  const color = tone === 'danger' ? 'var(--color-danger)' : tone === 'ok' ? 'var(--color-success)' : 'var(--color-text)';
  return (
    <div>
      <div className={styles.infoLabel}>{label}</div>
      <div className={styles.infoValue} style={{ color }}>
        {value}
      </div>
    </div>
  );
}

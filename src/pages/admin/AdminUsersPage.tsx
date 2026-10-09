import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { BanUserModal } from '@/features/admin/components/BanUserModal';
import { UserManagementTable } from '@/features/admin/components/UserManagementTable';
import { AppError } from '@/lib/errors';
import { useTranslation } from '@/i18n/useTranslation';
import { AdminShell } from '@/pages/admin/AdminShell';
import type { UserRole } from '@/features/auth/types';

import styles from '@/pages/admin/AdminUsersPage.module.css';

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const admin = useAdmin();
  const navigate = useNavigate();

  const [banTargetId, setBanTargetId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const users = useMemo(() => admin.listUsers(), [admin, refreshTick]);
  const stats = useMemo(() => admin.getDashboardStats(), [admin, refreshTick]);

  const refresh = () => {
    setRefreshTick((t) => t + 1);
  };

  const banTarget = banTargetId ? users.find((u) => u.id === banTargetId) : null;

  const handleBan = (id: string) => {
    setBanTargetId(id);
  };

  const handleUnban = (id: string) => {
    if (!user) return;
    try {
      admin.unbanUser(id, user);
      setErrorMsg(null);
      refresh();
    } catch (err) {
      const msg = err instanceof AppError ? err.message : String(err);
      setErrorMsg(msg);
      window.alert(msg);
    }
  };

  const handleDelete = (id: string) => {
    if (!user) return;
    const confirmed = window.confirm(t('common.confirm'));
    if (!confirmed) return;
    try {
      admin.deleteUser(id, user);
      setErrorMsg(null);
      refresh();
    } catch (err) {
      const code = err instanceof AppError ? err.code : null;
      let msg = err instanceof Error ? err.message : String(err);
      if (code === 'CANNOT_DELETE_SELF') msg = t('errors.cannotDeleteSelf');
      if (code === 'LAST_ADMIN') msg = t('errors.cannotDeleteLastAdmin');
      setErrorMsg(msg);
      window.alert(msg);
    }
  };

  const handleChangeRole = (id: string, role: UserRole) => {
    if (!user) return;
    try {
      admin.updateUser(id, { role }, user);
      setErrorMsg(null);
      refresh();
    } catch (err) {
      const code = err instanceof AppError ? err.code : null;
      let msg = err instanceof Error ? err.message : String(err);
      if (code === 'LAST_ADMIN') msg = t('admin.cannotDemoteLastAdmin');
      if (code === 'EMAIL_EXISTS') msg = t('errors.emailExists');
      setErrorMsg(msg);
      window.alert(msg);
      refresh();
    }
  };

  const handleView = (id: string) => {
    navigate(`/admin/users/${id}`);
  };

  const handleBanSubmit = (reason: string, until: string | 'permanent') => {
    if (!user || !banTargetId) return;
    try {
      admin.banUser({ id: banTargetId, reason, until, actor: user });
      setBanTargetId(null);
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

  const totalUsers = users.length;

  return (
    <AdminShell>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.usersTitle')}</h1>
          <p className={styles.intro}>{t('admin.usersIntro')}</p>
        </div>
      </header>

      <Card>
        <div className={styles.statsRow}>
          <StatCard label={t('admin.statPlayers')} value={stats.playerCount} tone="muted" />
          <StatCard label={t('admin.statEditors')} value={stats.editorCount} tone="muted" />
          <StatCard label={t('admin.statSupports')} value={stats.supportCount} tone="muted" />
          <StatCard label={t('admin.statAdmins')} value={stats.adminCount} tone="success" />
          <StatCard label={t('admin.statBanned')} value={stats.bannedCount} tone="warning" />
          <StatCard label={t('admin.statRecipes')} value={totalUsers} tone="muted" />
        </div>
      </Card>

      {errorMsg ? (
        <div className={styles.errorBanner} role="alert">
          {errorMsg}
        </div>
      ) : null}

      <Card>
        <UserManagementTable
          users={users}
          currentUserId={user?.id ?? ''}
          onBan={handleBan}
          onUnban={handleUnban}
          onDelete={handleDelete}
          onChangeRole={handleChangeRole}
          onView={handleView}
        />
      </Card>

      <BanUserModal
        isOpen={banTargetId !== null}
        onClose={() => setBanTargetId(null)}
        onSubmit={handleBanSubmit}
        userName={banTarget?.name ?? ''}
      />
    </AdminShell>
  );
}

function StatCard({
  label,
  value,
  tone = 'muted',
}: {
  label: string;
  value: number;
  tone?: 'muted' | 'warning' | 'success';
}) {
  const bg: Record<string, string> = {
    muted: 'var(--color-surface-muted)',
    warning: 'var(--color-accent-soft)',
    success: 'var(--color-success-soft)',
  };
  const fg: Record<string, string> = {
    muted: 'var(--color-text-muted)',
    warning: 'var(--color-accent)',
    success: 'var(--color-success)',
  };
  return (
    <div
      className={styles.stat}
      style={{
        background: bg[tone],
        border: '1px solid var(--color-border)',
      }}
    >
      <span className={styles.statLabel} style={{ color: fg[tone] }}>
        {label}
      </span>
      <span className={styles.statValue} style={{ color: fg[tone] }}>
        {value}
      </span>
    </div>
  );
}

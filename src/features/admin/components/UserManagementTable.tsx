import type { ChangeEvent } from 'react';

import { Button } from '@/components/Button';
import type { PublicUser, UserRole, UserStatus } from '@/features/auth/types';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/admin/components/UserManagementTable.module.css';

interface UserManagementTableProps {
  users: PublicUser[];
  currentUserId: string;
  onBan: (id: string) => void;
  onUnban: (id: string) => void;
  onDelete: (id: string) => void;
  onChangeRole: (id: string, role: UserRole) => void;
  onView: (id: string) => void;
}

const ROLE_OPTIONS: UserRole[] = ['player', 'support', 'editor', 'admin'];

export function UserManagementTable({
  users,
  currentUserId,
  onBan,
  onUnban,
  onDelete,
  onChangeRole,
  onView,
}: UserManagementTableProps) {
  const { t, dict } = useTranslation();

  const handleRoleChange = (userId: string, event: ChangeEvent<HTMLSelectElement>) => {
    onChangeRole(userId, event.target.value as UserRole);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.tableOverflow}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t('admin.colName')}</th>
              <th>{t('admin.colRole')}</th>
              <th>{t('common.status')}</th>
              <th>{t('admin.colWarningCount')}</th>
              <th>{t('admin.colCreatedAt')}</th>
              <th className={styles.actionsCol}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId;
              return (
                <tr key={user.id} className={styles.row}>
                  <td>
                    <div className={styles.userCell}>
                      <img
                        className={styles.avatar}
                        src={user.avatar}
                        alt={user.name}
                        onError={(event) => {
                          (event.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                        }}
                      />
                      <div className={styles.userInfo}>
                        <div className={styles.userName}>{user.name}</div>
                        <div className={styles.userEmail}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select
                      className={styles.roleSelect}
                      value={user.role}
                      aria-label={`${t('admin.changeRole')}: ${user.name}`}
                      onChange={(event) => handleRoleChange(user.id, event)}
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {dict.roles[role]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <StatusBadge status={user.status} t={t} />
                  </td>
                  <td>
                    <span
                      className={`${styles.warningCount} ${
                        (user.warningCount ?? 0) >= 3 ? styles.warningHigh : ''
                      }`}
                    >
                      {user.warningCount ?? 0}
                    </span>
                  </td>
                  <td className={styles.dateCell}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className={styles.actionsCell}>
                    <div className={styles.actionsGroup}>
                      <Button variant="ghost" className={styles.btnSm} onClick={() => onView(user.id)}>
                        {t('common.view')}
                      </Button>
                      {user.status === 'banned' ? (
                        <Button
                          variant="secondary"
                          className={styles.btnSm}
                          onClick={() => onUnban(user.id)}
                          disabled={isCurrentUser || user.role === 'admin'}
                        >
                          {t('admin.unbanUser')}
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          className={styles.btnSm}
                          onClick={() => onBan(user.id)}
                          disabled={isCurrentUser || user.role === 'admin'}
                        >
                          {t('admin.banUser')}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        className={`${styles.btnSm} ${styles.deleteBtn}`}
                        onClick={() => onDelete(user.id)}
                        disabled={isCurrentUser}
                      >
                        {t('admin.deleteUser')}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const STATUS_LABEL_KEYS: Record<UserStatus, string> = {
  active: 'recipeStatus.approved',
  banned: 'roles.banned',
};

function StatusBadge({ status, t }: { status: UserStatus; t: (key: string) => string }) {
  const isActive = status === 'active';
  return (
    <span className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusBanned}`}>
      {t(STATUS_LABEL_KEYS[status])}
    </span>
  );
}

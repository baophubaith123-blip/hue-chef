import type { AuditAction, AuditLogEntry } from '@/features/admin/types';
import type { PublicUser } from '@/features/auth/types';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/admin/components/AuditLogTable.module.css';

interface AuditLogTableProps {
  entries: AuditLogEntry[];
  userMap: Record<string, PublicUser>;
}

type ActionGroup = 'user' | 'recipe' | 'achievement' | 'comment' | 'report' | 'appeal' | 'setting' | 'backup' | 'broadcast' | 'other';

function actionGroup(action: AuditAction): ActionGroup {
  const prefix = action.split('.')[0];
  switch (prefix) {
    case 'user':
    case 'recipe':
    case 'achievement':
    case 'comment':
    case 'report':
    case 'appeal':
    case 'setting':
    case 'backup':
    case 'broadcast':
      return prefix;
    default:
      return 'other';
  }
}

export function AuditLogTable({ entries, userMap }: AuditLogTableProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.wrap}>
      <div className={styles.tableOverflow}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t('admin.colActor')}</th>
              <th>{t('admin.colAction')}</th>
              <th>{t('admin.colTarget')}</th>
              <th>{t('admin.colDetail')}</th>
              <th>{t('admin.colCreatedAt')}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const actor = userMap[entry.actorId];
              const actorName = actor ? actor.name : entry.actorId;
              const group = actionGroup(entry.action);
              return (
                <tr key={entry.id} className={styles.row}>
                  <td>
                    <div className={styles.actorCell}>
                      {actor ? (
                        <img
                          className={styles.avatar}
                          src={actor.avatar}
                          alt={actor.name}
                          onError={(event) => {
                            (event.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                          }}
                        />
                      ) : null}
                      <div className={styles.actorInfo}>
                        <div className={styles.actorName}>{actorName}</div>
                        <div className={styles.actorRole}>{entry.actorRole}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.actionChip} ${styles[`group-${group}`]}`}>
                      {entry.action}
                    </span>
                  </td>
                  <td className={styles.targetCell}>
                    {entry.targetId ? (
                      <div>
                        <div className={styles.targetId}>{entry.targetId}</div>
                        <div className={styles.targetType}>{entry.targetType ?? '—'}</div>
                      </div>
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </td>
                  <td className={styles.detailCell}>
                    <code className={styles.detailCode} title={JSON.stringify(entry.detail)}>
                      {JSON.stringify(entry.detail)}
                    </code>
                  </td>
                  <td className={styles.dateCell}>
                    {new Date(entry.createdAt).toLocaleString()}
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

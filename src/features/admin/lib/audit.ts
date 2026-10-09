import type { PublicUser } from '@/features/auth/types';
import type { AuditAction, AuditLogEntry } from '@/features/admin/types';
import { getJsonStorage, setJsonStorage, STORAGE_KEYS } from '@/lib/storage';

function createAuditId(): string {
  return `audit-${crypto.randomUUID()}`;
}

export function loadAuditLog(): AuditLogEntry[] {
  const stored = getJsonStorage<AuditLogEntry[]>(STORAGE_KEYS.auditLog);
  if (!stored || !Array.isArray(stored)) {
    return [];
  }
  return stored;
}

export function saveAuditLog(entries: AuditLogEntry[]): void {
  setJsonStorage(STORAGE_KEYS.auditLog, entries);
}

export function appendAudit(
  actor: Pick<PublicUser, 'id' | 'role'> | null,
  action: AuditAction,
  options: { targetId?: string; targetType?: AuditLogEntry['targetType']; detail?: Record<string, unknown> } = {},
): AuditLogEntry {
  const entries = loadAuditLog();
  const entry: AuditLogEntry = {
    id: createAuditId(),
    actorId: actor?.id ?? 'system',
    actorRole: actor?.role ?? 'admin',
    action,
    targetId: options.targetId,
    targetType: options.targetType,
    detail: options.detail ?? {},
    createdAt: new Date().toISOString(),
  };
  const next = [entry, ...entries].slice(0, 2000);
  saveAuditLog(next);
  return entry;
}

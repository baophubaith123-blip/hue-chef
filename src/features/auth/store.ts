import { SEED_USERS } from '@/data/users';
import type { StoredUser } from '@/features/auth/types';
import { getJsonStorage, setJsonStorage, STORAGE_KEYS } from '@/lib/storage';

export function loadUsers(): StoredUser[] {
  const stored = getJsonStorage<StoredUser[]>(STORAGE_KEYS.users);
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    setJsonStorage(STORAGE_KEYS.users, SEED_USERS);
    return SEED_USERS.map((user) => ({ ...user }));
  }
  return stored;
}

export function saveUsers(users: StoredUser[]): void {
  setJsonStorage(STORAGE_KEYS.users, users);
}

export function findUserByEmail(users: StoredUser[], email: string): StoredUser | undefined {
  const normalized = email.trim().toLowerCase();
  return users.find((user) => user.email.toLowerCase() === normalized);
}

export function findUserById(users: StoredUser[], id: string): StoredUser | undefined {
  return users.find((user) => user.id === id);
}

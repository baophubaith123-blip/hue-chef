export const STORAGE_KEYS = {
  users: 'hue-chef-users',
  auth: 'hue-chef-auth',
  recipes: 'hue-chef-recipes',
  inbox: 'hue-chef-inbox',
  chatThreads: 'hue-chef-chat-threads',
  chatMessages: 'hue-chef-chat-messages',
  appeals: 'hue-chef-appeals',
  auditLog: 'hue-chef-audit-log',
  broadcast: 'hue-chef-broadcast',
  achievements: 'hue-chef-achievements',
  notifications: 'hue-chef-notifications',
  comments: 'hue-chef-comments',
  reports: 'hue-chef-reports',
  ingredients: 'hue-chef-ingredients',
  adminSettings: 'hue-chef-admin-settings',
} as const;

export function getStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setStorageItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore quota / private mode
  }
}

export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function getJsonStorage<T>(key: string): T | null {
  const raw = getStorageItem(key);
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    removeStorageItem(key);
    return null;
  }
}

export function setJsonStorage<T>(key: string, value: T): void {
  setStorageItem(key, JSON.stringify(value));
}

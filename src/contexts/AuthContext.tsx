import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  findUserByEmail,
  findUserById,
  loadUsers,
  saveUsers,
  updateStoredUserById,
} from '@/features/auth/store';
import { isBanActive } from '@/features/auth/types';
import type {
  AuthSession,
  CookedRecipeEntry,
  PublicUser,
  StoredUser,
  UserRole,
} from '@/features/auth/types';
import { toPublicUser } from '@/features/auth/types';
import { AppError } from '@/lib/errors';
import { calculateLevelProgress } from '@/lib/score';
import { getJsonStorage, removeStorageItem, setJsonStorage, STORAGE_KEYS } from '@/lib/storage';

export interface AddXpResult {
  gainedXp: number;
  level: number;
  exp: number;
  maxExp: number;
  leveledUp: boolean;
  gainedLevels: number;
}

interface AuthContextValue {
  user: PublicUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<PublicUser>;
  register: (name: string, email: string, password: string) => Promise<PublicUser>;
  logout: () => void;
  addXp: (xp: number) => AddXpResult | null;
  addCoins: (amount: number) => number | null;
  purchaseRecipe: (recipeId: string, price: number) => boolean;
  addCookedRecipe: (entry: CookedRecipeEntry) => void;
  updateProfile: (patch: Partial<Pick<StoredUser, 'name' | 'avatar' | 'password' | 'equippedAchievementId'>>) => PublicUser | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): AuthSession | null {
  const session = getJsonStorage<AuthSession>(STORAGE_KEYS.auth);
  if (!session || typeof session.userId !== 'string') {
    removeStorageItem(STORAGE_KEYS.auth);
    return null;
  }
  return session;
}

function createPlayerId(): string {
  return `player-${crypto.randomUUID()}`;
}

/** If a dated ban has expired, lift it in the users store and return the fresh record. */
function liftExpiredBan(users: StoredUser[], stored: StoredUser): StoredUser {
  if (stored.status === 'banned' && !isBanActive(stored)) {
    const updated = updateStoredUserById(users, stored.id, {
      status: 'active',
      banReason: undefined,
      banUntil: undefined,
    });
    saveUsers(updated);
    return updated.find((u) => u.id === stored.id) ?? stored;
  }
  return stored;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = readSession();
    if (!session) {
      setIsLoading(false);
      return;
    }
    const users = loadUsers();
    let stored = findUserById(users, session.userId);
    if (!stored) {
      removeStorageItem(STORAGE_KEYS.auth);
      setUser(null);
    } else {
      stored = liftExpiredBan(users, stored);
      const achStore = getJsonStorage<{ byUser?: Record<string, { id: string }[]> }>(STORAGE_KEYS.achievements);
      const targetId = stored.id;
      const storeIds = achStore?.byUser?.[targetId]?.map((e) => e.id) ?? [];
      const userIds = stored.unlockedAchievements ?? [];
      if (storeIds.length > userIds.length || storeIds.some((id) => !userIds.includes(id))) {
        const merged = Array.from(new Set([...userIds, ...storeIds]));
        const updated = updateStoredUserById(users, targetId, { unlockedAchievements: merged });
        saveUsers(updated);
        stored = updated.find((u) => u.id === targetId) ?? stored;
      }
      setUser(toPublicUser(stored));
    }
    setIsLoading(false);
  }, []);

  // Idle auto-logout: the admin settings define how long a session may sit
  // unused (afkTimeoutSeconds). Activity resets the clock.
  useEffect(() => {
    if (!user) return;
    let lastActivity = Date.now();
    const mark = () => {
      lastActivity = Date.now();
    };
    const events = ['mousedown', 'keydown', 'touchstart', 'click'] as const;
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }));
    const timer = window.setInterval(() => {
      const settings = getJsonStorage<{ afkTimeoutSeconds?: number }>(STORAGE_KEYS.adminSettings);
      const seconds = settings?.afkTimeoutSeconds;
      if (typeof seconds !== 'number' || seconds <= 0) return;
      if (Date.now() - lastActivity >= seconds * 1000) {
        removeStorageItem(STORAGE_KEYS.auth);
        setUser(null);
      }
    }, 15000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, mark));
      window.clearInterval(timer);
    };
  }, [user]);

  // Keep the in-memory snapshot in sync with the users store: an admin may
  // ban/unban or re-role this account from another tab or page.
  useEffect(() => {
    const resync = () => {
      const session = readSession();
      if (!session) return;
      const users = loadUsers();
      const stored = findUserById(users, session.userId);
      if (!stored) {
        removeStorageItem(STORAGE_KEYS.auth);
        setUser(null);
        return;
      }
      const fresh = liftExpiredBan(users, stored);
      setUser((prev) => {
        const next = toPublicUser(fresh);
        return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
      });
    };
    window.addEventListener('focus', resync);
    window.addEventListener('storage', resync);
    return () => {
      window.removeEventListener('focus', resync);
      window.removeEventListener('storage', resync);
    };
  }, []);

  const persistSession = useCallback((stored: StoredUser) => {
    setJsonStorage(STORAGE_KEYS.auth, { userId: stored.id } satisfies AuthSession);
    setUser(toPublicUser(stored));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<PublicUser> => {
    const users = loadUsers();
    const found = findUserByEmail(users, email);
    if (!found) {
      throw new AppError('Email does not exist', 'EMAIL_NOT_FOUND');
    }
    if (found.password !== password) {
      throw new AppError('Incorrect password', 'INVALID_PASSWORD');
    }
    const fresh = liftExpiredBan(loadUsers(), found);
    persistSession(fresh);
    return toPublicUser(fresh);
  }, [persistSession]);

  const register = useCallback(async (name: string, email: string, password: string): Promise<PublicUser> => {
    const users = loadUsers();
    if (findUserByEmail(users, email)) {
      throw new AppError('Email is already registered', 'EMAIL_EXISTS');
    }
    const newUser: StoredUser = {
      id: createPlayerId(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'player' satisfies UserRole,
      avatar: '',
      status: 'active',
      createdAt: new Date().toISOString(),
      level: 1,
      exp: 0,
      maxExp: 1000,
      coins: 0,
      ownedRecipeIds: [],
      cookedRecipes: [],
      unlockedAchievements: [],
      warningCount: 0,
    };
    const next = [...users, newUser];
    saveUsers(next);
    persistSession(newUser);
    return toPublicUser(newUser);
  }, [persistSession]);

  const logout = useCallback(() => {
    removeStorageItem(STORAGE_KEYS.auth);
    setUser(null);
  }, []);

  const persistStoredUser = useCallback((userId: string, patch: Partial<StoredUser>): StoredUser | null => {
    const users = loadUsers();
    const stored = findUserById(users, userId);
    if (!stored) return null;
    const next = updateStoredUserById(users, userId, patch);
    saveUsers(next);
    const updated = next.find((u) => u.id === userId) ?? null;
    if (updated) setUser(toPublicUser(updated));
    return updated;
  }, []);

  const addXp = useCallback(
    (xp: number): AddXpResult | null => {
      if (!user) return null;
      const users = loadUsers();
      const stored = findUserById(users, user.id);
      if (!stored) return null;
      const currentExp = stored.exp ?? 0;
      const currentMaxExp = stored.maxExp ?? 1000;
      const result = calculateLevelProgress(currentExp, currentMaxExp, xp);
      const patch: Partial<StoredUser> = {
        level: result.level,
        exp: result.exp,
        maxExp: result.maxExp,
      };
      persistStoredUser(user.id, patch);
      return { gainedXp: xp, ...result };
    },
    [user, persistStoredUser],
  );

  const addCoins = useCallback(
    (amount: number): number | null => {
      if (!user || amount === 0) return null;
      const users = loadUsers();
      const stored = findUserById(users, user.id);
      if (!stored) return null;
      const nextBalance = Math.max(0, (stored.coins ?? 0) + amount);
      if (amount > 0) {
        persistStoredUser(user.id, {
          coins: nextBalance,
          totalCoinsEarned: (stored.totalCoinsEarned ?? 0) + amount,
        });
      } else {
        persistStoredUser(user.id, { coins: nextBalance });
      }
      return nextBalance;
    },
    [user, persistStoredUser],
  );

  const purchaseRecipe = useCallback(
    (recipeId: string, price: number): boolean => {
      if (!user) return false;
      const users = loadUsers();
      const stored = findUserById(users, user.id);
      if (!stored) return false;
      const owned = stored.ownedRecipeIds ?? [];
      if (owned.includes(recipeId)) return true;
      const balance = stored.coins ?? 0;
      if (balance < price) return false;
      persistStoredUser(user.id, {
        coins: balance - price,
        ownedRecipeIds: [...owned, recipeId],
      });
      return true;
    },
    [user, persistStoredUser],
  );

  const addCookedRecipe = useCallback(
    (entry: CookedRecipeEntry): void => {
      if (!user) return;
      const users = loadUsers();
      const stored = findUserById(users, user.id);
      if (!stored) return;
      const current = stored.cookedRecipes ?? [];
      const nextEntries = [...current, entry];
      persistStoredUser(user.id, { cookedRecipes: nextEntries });
    },
    [user, persistStoredUser],
  );

  const updateProfile = useCallback(
    (patch: Partial<Pick<StoredUser, 'name' | 'avatar' | 'password' | 'equippedAchievementId'>>): PublicUser | null => {
      if (!user) return null;
      const updated = persistStoredUser(user.id, patch);
      return updated ? toPublicUser(updated) : null;
    },
    [user, persistStoredUser],
  );

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      register,
      logout,
      addXp,
      addCoins,
      purchaseRecipe,
      addCookedRecipe,
      updateProfile,
    }),
    [user, isLoading, login, register, logout, addXp, addCoins, purchaseRecipe, addCookedRecipe, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new AppError('useAuth must be used within AuthProvider', 'AUTH_CONTEXT');
  }
  return ctx;
}

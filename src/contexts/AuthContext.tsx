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
import { SEED_RECIPES } from '@/data/recipes';
import { migrateLicenseFields } from '@/features/journey/lib/journey';
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
  /** Instant guest play from the title screen (Gói Game-Shell): creates
   *  (or reuses) the local guest profile and starts its session. */
  playAsGuest: (displayName: string) => PublicUser;
  logout: () => void;
  addXp: (xp: number) => AddXpResult | null;
  addCoins: (amount: number) => number | null;
  /** Credit/debit the cok wallet (sell loop, mục 6.8); returns balance. */
  addCok: (amount: number) => number | null;
  purchaseRecipe: (recipeId: string, price: number) => boolean;
  addCookedRecipe: (entry: CookedRecipeEntry) => void;
  /** Record a dish's sell license after its own boss stage is beaten
   * (luật trùm theo món). Returns true only when newly granted. */
  grantDishLicense: (recipeId: string) => boolean;
  /** Record a chapter boss clear — the area-unlock milestone (luật mới:
   * the chapter boss no longer grants any sell license). Returns true
   * only when newly recorded. */
  grantBossClear: (chapterId: string) => boolean;
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

/**
 * Guest merge (Gói Game-Shell, H9 union law): when the current session
 * belongs to a guest profile and a real account signs in / registers,
 * the guest's progress folds into that account — histories union,
 * wallets take the max, nothing is ever deleted from the account — and
 * the guest record is consumed. Returns the merged target record.
 */
function mergeGuestProgress(users: StoredUser[], target: StoredUser): StoredUser {
  const session = readSession();
  if (!session || session.userId === target.id) return target;
  const guest = findUserById(users, session.userId);
  if (!guest?.guest) return target;

  const unionIds = (a: string[] = [], b: string[] = []): string[] =>
    Array.from(new Set([...a, ...b]));
  const cookedByKey = new Map<string, CookedRecipeEntry>();
  for (const entry of [...(target.cookedRecipes ?? []), ...(guest.cookedRecipes ?? [])]) {
    cookedByKey.set(`${entry.recipeId}|${entry.cookedAt}`, entry);
  }
  const guestWinsLevel =
    (guest.level ?? 1) > (target.level ?? 1) ||
    ((guest.level ?? 1) === (target.level ?? 1) && (guest.exp ?? 0) > (target.exp ?? 0));
  const levelSide = guestWinsLevel ? guest : target;

  const merged: StoredUser = {
    ...target,
    coins: Math.max(target.coins ?? 0, guest.coins ?? 0),
    cok: Math.max(target.cok ?? 0, guest.cok ?? 0),
    totalCoinsEarned: Math.max(target.totalCoinsEarned ?? 0, guest.totalCoinsEarned ?? 0),
    level: levelSide.level,
    exp: levelSide.exp,
    maxExp: levelSide.maxExp,
    ownedRecipeIds: unionIds(target.ownedRecipeIds, guest.ownedRecipeIds),
    cookedRecipes: Array.from(cookedByKey.values()),
    unlockedAchievements: unionIds(target.unlockedAchievements, guest.unlockedAchievements),
    sellLicenses: unionIds(target.sellLicenses, guest.sellLicenses),
    dishLicenses: unionIds(target.dishLicenses, guest.dishLicenses),
    bossClears: unionIds(target.bossClears, guest.bossClears),
    equippedAchievementId: target.equippedAchievementId ?? guest.equippedAchievementId ?? null,
  };
  const next = users
    .filter((u) => u.id !== guest.id)
    .map((u) => (u.id === target.id ? merged : u));
  saveUsers(next);
  return merged;
}

/**
 * License migration (luật trùm theo món, Bảo chốt 2026-11-20): fold a
 * stored record's legacy chapter licenses into the new-law fields —
 * dishLicenses gains every dish of each legacy-licensed chapter and
 * bossClears gains those chapters — and persist when anything changed.
 * The legacy field itself is kept untouched (old sync payloads and the
 * dynamic conversion in the journey lib both still read it). Expansion
 * runs over the seed catalogue, the same seam the sync layer uses.
 */
function migrateStoredLicenses(users: StoredUser[], stored: StoredUser): StoredUser {
  const migration = migrateLicenseFields(stored, SEED_RECIPES);
  if (!migration.changed) return stored;
  const next = updateStoredUserById(users, stored.id, {
    dishLicenses: migration.dishLicenses,
    bossClears: migration.bossClears,
  });
  saveUsers(next);
  return next.find((u) => u.id === stored.id) ?? stored;
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
      stored = migrateStoredLicenses(loadUsers(), stored);
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
    const merged = mergeGuestProgress(users, found);
    const lifted = liftExpiredBan(loadUsers(), merged);
    const fresh = migrateStoredLicenses(loadUsers(), lifted);
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
      sellLicenses: [],
      dishLicenses: [],
      bossClears: [],
      warningCount: 0,
    };
    const next = [...users, newUser];
    saveUsers(next);
    const merged = mergeGuestProgress(loadUsers(), newUser);
    const migrated = migrateStoredLicenses(loadUsers(), merged);
    persistSession(migrated);
    return toPublicUser(migrated);
  }, [persistSession]);

  const playAsGuest = useCallback(
    (displayName: string): PublicUser => {
      const users = loadUsers();
      const existing = users.find((u) => u.guest);
      if (existing) {
        persistSession(existing);
        return toPublicUser(existing);
      }
      const id = `guest-${crypto.randomUUID()}`;
      const guestUser: StoredUser = {
        id,
        name: displayName,
        email: `${id}@guest.local`,
        password: '',
        role: 'player' satisfies UserRole,
        avatar: '',
        status: 'active',
        createdAt: new Date().toISOString(),
        level: 1,
        exp: 0,
        maxExp: 1000,
        coins: 0,
        cok: 0,
        ownedRecipeIds: [],
        cookedRecipes: [],
        unlockedAchievements: [],
        sellLicenses: [],
        dishLicenses: [],
        bossClears: [],
        warningCount: 0,
        guest: true,
      };
      saveUsers([...users, guestUser]);
      persistSession(guestUser);
      return toPublicUser(guestUser);
    },
    [persistSession],
  );

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

  const addCok = useCallback(
    (amount: number): number | null => {
      if (!user || amount === 0) return null;
      const users = loadUsers();
      const stored = findUserById(users, user.id);
      if (!stored) return null;
      const nextBalance = Math.max(0, (stored.cok ?? 0) + amount);
      persistStoredUser(user.id, { cok: nextBalance });
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

  const grantDishLicense = useCallback(
    (recipeId: string): boolean => {
      if (!user) return false;
      const users = loadUsers();
      const stored = findUserById(users, user.id);
      if (!stored) return false;
      const current = stored.dishLicenses ?? [];
      if (current.includes(recipeId)) return false;
      persistStoredUser(user.id, { dishLicenses: [...current, recipeId] });
      return true;
    },
    [user, persistStoredUser],
  );

  const grantBossClear = useCallback(
    (chapterId: string): boolean => {
      if (!user) return false;
      const users = loadUsers();
      const stored = findUserById(users, user.id);
      if (!stored) return false;
      const current = stored.bossClears ?? [];
      if (current.includes(chapterId) || (stored.sellLicenses ?? []).includes(chapterId)) {
        return false;
      }
      persistStoredUser(user.id, { bossClears: [...current, chapterId] });
      return true;
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
      playAsGuest,
      logout,
      addXp,
      addCoins,
      addCok,
      purchaseRecipe,
      addCookedRecipe,
      grantDishLicense,
      grantBossClear,
      updateProfile,
    }),
    [user, isLoading, login, register, playAsGuest, logout, addXp, addCoins, addCok, purchaseRecipe, addCookedRecipe, grantDishLicense, grantBossClear, updateProfile],
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

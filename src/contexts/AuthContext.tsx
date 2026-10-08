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
} from '@/features/auth/store';
import type { AuthSession, PublicUser, StoredUser, UserRole } from '@/features/auth/types';
import { toPublicUser } from '@/features/auth/types';
import { AppError } from '@/lib/errors';
import { getJsonStorage, removeStorageItem, setJsonStorage, STORAGE_KEYS } from '@/lib/storage';

interface AuthContextValue {
  user: PublicUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<PublicUser>;
  register: (name: string, email: string, password: string) => Promise<PublicUser>;
  logout: () => void;
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
    const stored = findUserById(users, session.userId);
    if (!stored || stored.status === 'banned') {
      removeStorageItem(STORAGE_KEYS.auth);
      setUser(null);
    } else {
      setUser(toPublicUser(stored));
    }
    setIsLoading(false);
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
    if (found.status === 'banned') {
      throw new AppError('Account is banned', 'ACCOUNT_BANNED');
    }
    persistSession(found);
    return toPublicUser(found);
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
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
      status: 'active',
      createdAt: new Date().toISOString(),
      level: 1,
      exp: 0,
      maxExp: 1000,
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

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
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

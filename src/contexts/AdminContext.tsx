import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

import type { Ingredient, Recipe } from '@/data/types';
import { loadAuditLog, appendAudit } from '@/features/admin/lib/audit';
import type { AdminDashboardStats, AdminSettings, AuditAction, AuditLogEntry } from '@/features/admin/types';
import { findUserById, loadUsers, saveUsers } from '@/features/auth/store';
import type { PublicUser, StoredUser, UserRole } from '@/features/auth/types';
import { toPublicUser } from '@/features/auth/types';
import type { Achievement } from '@/data/types';
import { AppError } from '@/lib/errors';
import { getJsonStorage, setJsonStorage, STORAGE_KEYS } from '@/lib/storage';

export interface AdminContextValue {
  listUsers: () => PublicUser[];
  getUser: (id: string) => PublicUser | null;
  updateUser: (id: string, patch: Partial<Pick<StoredUser, 'name' | 'email' | 'role' | 'avatar'>>, actor: PublicUser) => PublicUser;
  banUser: (args: { id: string; reason: string; until: string | 'permanent'; actor: PublicUser }) => PublicUser;
  unbanUser: (id: string, actor: PublicUser) => PublicUser;
  deleteUser: (id: string, actor: PublicUser) => void;
  listAuditLog: (options?: { action?: AuditAction; actorId?: string }) => AuditLogEntry[];
  getDashboardStats: () => AdminDashboardStats;
  listIngredients: () => Ingredient[];
  upsertIngredient: (ingredient: Ingredient, actor: PublicUser) => Ingredient;
  deleteIngredient: (id: string, actor: PublicUser) => void;
  upsertAchievement: (achievement: Achievement, actor: PublicUser) => void;
  deleteAchievement: (id: string, actor: PublicUser) => void;
  listAdminAchievements: () => Achievement[];
  getSettings: () => AdminSettings;
  updateSettings: (patch: Partial<AdminSettings>, actor: PublicUser) => AdminSettings;
  exportAll: (actor: PublicUser) => { users: StoredUser[]; recipes: Recipe[]; timestamp: string };
  importAll: (payload: { users?: StoredUser[]; recipes?: Recipe[] }, actor: PublicUser) => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

const DEFAULT_SETTINGS: AdminSettings = {
  maxUploadMB: 5,
  afkTimeoutSeconds: 600,
  autoBanAfterWarnings: 3,
  maxRecipeScore: 5000,
  maintenanceMode: false,
};

function loadIngredients(): Ingredient[] {
  const data = getJsonStorage<Ingredient[]>(STORAGE_KEYS.ingredients);
  if (!Array.isArray(data)) return [];
  return data;
}

function saveIngredients(list: Ingredient[]): void {
  setJsonStorage(STORAGE_KEYS.ingredients, list);
}

function loadAchievementsStore(): Achievement[] {
  const data = getJsonStorage<Achievement[]>(STORAGE_KEYS.achievements);
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && 'condition' in (data[0] as object)) {
    return data;
  }
  return [];
}

function saveAchievementsStore(list: Achievement[]): void {
  setJsonStorage(STORAGE_KEYS.achievements, list);
}

function loadSettings(): AdminSettings {
  const data = getJsonStorage<AdminSettings>(STORAGE_KEYS.adminSettings);
  if (!data || typeof data !== 'object') return { ...DEFAULT_SETTINGS };
  return { ...DEFAULT_SETTINGS, ...data };
}

function saveSettings(settings: AdminSettings): void {
  setJsonStorage(STORAGE_KEYS.adminSettings, settings);
}

function countAdminUsers(users: StoredUser[]): number {
  return users.filter((u) => u.role === 'admin' && u.status === 'active').length;
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const listUsers = useCallback((): PublicUser[] => {
    return loadUsers().map(toPublicUser);
  }, []);

  const getUser = useCallback((id: string): PublicUser | null => {
    const users = loadUsers();
    const found = findUserById(users, id);
    return found ? toPublicUser(found) : null;
  }, []);

  const updateUser = useCallback<AdminContextValue['updateUser']>((id, patch, actor) => {
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new AppError('User not found', 'USER_NOT_FOUND');
    const target = users[idx];
    if (patch.role !== undefined && target.role !== patch.role) {
      if (target.role === 'admin' && countAdminUsers(users) <= 1 && patch.role !== 'admin') {
        throw new AppError('Cannot demote last admin', 'LAST_ADMIN');
      }
    }
    if (patch.email !== undefined) {
      const duplicate = users.find((u) => u.email.toLowerCase() === (patch.email ?? '').toLowerCase() && u.id !== id);
      if (duplicate) throw new AppError('Email already in use', 'EMAIL_EXISTS');
    }
    const updated: StoredUser = {
      ...target,
      ...patch,
      email: patch.email ? patch.email.trim().toLowerCase() : target.email,
      name: patch.name ? patch.name.trim() : target.name,
    };
    users[idx] = updated;
    saveUsers(users);
    appendAudit(actor, 'user.update', { targetId: id, targetType: 'user', detail: { patch: Object.keys(patch) } });
    return toPublicUser(updated);
  }, []);

  const banUser = useCallback<AdminContextValue['banUser']>(({ id, reason, until, actor }) => {
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new AppError('User not found', 'USER_NOT_FOUND');
    if (users[idx].role === 'admin') {
      throw new AppError('Cannot ban admin user', 'BAN_ADMIN');
    }
    users[idx] = { ...users[idx], status: 'banned' };
    saveUsers(users);
    appendAudit(actor, 'user.ban', { targetId: id, targetType: 'user', detail: { reason, until } });
    return toPublicUser(users[idx]);
  }, []);

  const unbanUser = useCallback<AdminContextValue['unbanUser']>((id, actor) => {
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new AppError('User not found', 'USER_NOT_FOUND');
    users[idx] = { ...users[idx], status: 'active' };
    if (typeof users[idx].warningCount === 'number') {
      users[idx].warningCount = 0;
    }
    saveUsers(users);
    appendAudit(actor, 'user.unban', { targetId: id, targetType: 'user' });
    return toPublicUser(users[idx]);
  }, []);

  const deleteUser = useCallback<AdminContextValue['deleteUser']>((id, actor) => {
    if (actor.id === id) {
      throw new AppError('Cannot delete yourself', 'CANNOT_DELETE_SELF');
    }
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new AppError('User not found', 'USER_NOT_FOUND');
    const target = users[idx];
    if (target.role === 'admin') {
      const adminsRemaining = countAdminUsers(users) - 1;
      if (adminsRemaining < 1) {
        throw new AppError('Cannot delete last admin', 'LAST_ADMIN');
      }
    }
    users.splice(idx, 1);
    saveUsers(users);
    appendAudit(actor, 'user.delete', { targetId: id, targetType: 'user', detail: { deletedRole: target.role } });
  }, []);

  const listAuditLog = useCallback<AdminContextValue['listAuditLog']>((options = {}) => {
    const log = loadAuditLog();
    return log.filter((e) => {
      if (options.action && e.action !== options.action) return false;
      if (options.actorId && e.actorId !== options.actorId) return false;
      return true;
    });
  }, []);

  const getDashboardStats = useCallback((): AdminDashboardStats => {
    const users = loadUsers();
    const recipes = (getJsonStorage<Recipe[]>(STORAGE_KEYS.recipes) ?? []);
    const appealStore = getJsonStorage<{ status: string }[]>(STORAGE_KEYS.appeals);
    const appeals = Array.isArray(appealStore) ? appealStore : [];
    const reportStore = getJsonStorage<{ status: string }[]>(STORAGE_KEYS.reports);
    const reports = Array.isArray(reportStore) ? reportStore : [];

    let playerCount = 0;
    let editorCount = 0;
    let supportCount = 0;
    let adminCount = 0;
    let bannedCount = 0;
    let unlockedSum = 0;
    for (const u of users) {
      if (u.status === 'banned') bannedCount += 1;
      if (u.role === 'player') playerCount += 1;
      if (u.role === 'editor') editorCount += 1;
      if (u.role === 'support') supportCount += 1;
      if (u.role === 'admin') adminCount += 1;
      unlockedSum += Array.isArray(u.unlockedAchievements) ? u.unlockedAchievements.length : 0;
    }
    return {
      playerCount,
      editorCount,
      supportCount,
      adminCount,
      bannedCount,
      recipeCount: recipes.length,
      pendingRecipeCount: recipes.filter((r) => r.status === 'pending').length,
      appealCount: appeals.length,
      openAppealCount: appeals.filter((a) => a.status !== 'accepted' && a.status !== 'rejected').length,
      unlockedAchievementsSum: unlockedSum,
      reportCount: reports.length,
      openReportCount: reports.filter((r) => r.status === 'open').length,
    };
  }, []);

  const listIngredients = useCallback((): Ingredient[] => loadIngredients(), []);

  const upsertIngredient = useCallback<AdminContextValue['upsertIngredient']>((ingredient, actor) => {
    const list = loadIngredients();
    const idx = list.findIndex((i) => i.id === ingredient.id);
    if (idx === -1) list.push(ingredient);
    else list[idx] = ingredient;
    saveIngredients(list);
    appendAudit(actor, idx === -1 ? 'achievement.create' : 'achievement.update', {
      targetId: ingredient.id,
      targetType: 'achievement',
      detail: { ingredient: ingredient.name },
    });
    return ingredient;
  }, []);

  const deleteIngredient = useCallback<AdminContextValue['deleteIngredient']>((id, actor) => {
    const list = loadIngredients().filter((i) => i.id !== id);
    saveIngredients(list);
    appendAudit(actor, 'achievement.delete', { targetId: id, targetType: 'achievement' });
  }, []);

  const listAdminAchievements = useCallback((): Achievement[] => {
    const custom = loadAchievementsStore();
    if (custom.length > 0) return custom;
    return [];
  }, []);

  const upsertAchievement = useCallback<AdminContextValue['upsertAchievement']>((achievement, actor) => {
    const list = loadAchievementsStore();
    const idx = list.findIndex((a) => a.id === achievement.id);
    if (idx === -1) list.push(achievement);
    else list[idx] = achievement;
    saveAchievementsStore(list);
    appendAudit(actor, idx === -1 ? 'achievement.create' : 'achievement.update', {
      targetId: achievement.id,
      targetType: 'achievement',
      detail: { name: achievement.name },
    });
  }, []);

  const deleteAchievement = useCallback<AdminContextValue['deleteAchievement']>((id, actor) => {
    const list = loadAchievementsStore().filter((a) => a.id !== id);
    saveAchievementsStore(list);
    appendAudit(actor, 'achievement.delete', { targetId: id, targetType: 'achievement' });
  }, []);

  const getSettings = useCallback((): AdminSettings => loadSettings(), []);

  const updateSettings = useCallback<AdminContextValue['updateSettings']>((patch, actor) => {
    const current = loadSettings();
    const next: AdminSettings = { ...current, ...patch };
    saveSettings(next);
    appendAudit(actor, 'setting.update', { targetType: 'setting', detail: { keys: Object.keys(patch) } });
    return next;
  }, []);

  const exportAll = useCallback<AdminContextValue['exportAll']>((actor) => {
    const users = loadUsers();
    const recipes = (getJsonStorage<Recipe[]>(STORAGE_KEYS.recipes) ?? []);
    appendAudit(actor, 'backup.export', { targetType: 'user', detail: { userCount: users.length, recipeCount: recipes.length } });
    return { users, recipes, timestamp: new Date().toISOString() };
  }, []);

  const importAll = useCallback<AdminContextValue['importAll']>((payload, actor) => {
    if (payload.users) {
      const existing = loadUsers();
      const idMap = new Map(existing.map((u) => [u.id, u]));
      for (const u of payload.users) idMap.set(u.id, u);
      const merged: StoredUser[] = [];
      idMap.forEach((v) => merged.push(v));
      saveUsers(merged);
    }
    if (payload.recipes) {
      setJsonStorage(STORAGE_KEYS.recipes, payload.recipes);
    }
    appendAudit(actor, 'backup.import', {
      targetType: 'user',
      detail: { userCount: payload.users?.length ?? 0, recipeCount: payload.recipes?.length ?? 0 },
    });
  }, []);

  const value = useMemo<AdminContextValue>(
    () => ({
      listUsers,
      getUser,
      updateUser,
      banUser,
      unbanUser,
      deleteUser,
      listAuditLog,
      getDashboardStats,
      listIngredients,
      upsertIngredient,
      deleteIngredient,
      upsertAchievement,
      deleteAchievement,
      listAdminAchievements,
      getSettings,
      updateSettings,
      exportAll,
      importAll,
    }),
    [
      listUsers,
      getUser,
      updateUser,
      banUser,
      unbanUser,
      deleteUser,
      listAuditLog,
      getDashboardStats,
      listIngredients,
      upsertIngredient,
      deleteIngredient,
      upsertAchievement,
      deleteAchievement,
      listAdminAchievements,
      getSettings,
      updateSettings,
      exportAll,
      importAll,
    ],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}

export type { UserRole };

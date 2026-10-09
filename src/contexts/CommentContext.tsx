import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

import type { CommentReport, RecipeComment } from '@/features/comments/types';
import type { PublicUser } from '@/features/auth/types';
import { AppError } from '@/lib/errors';
import { getJsonStorage, setJsonStorage, STORAGE_KEYS } from '@/lib/storage';

export interface CommentContextValue {
  listForRecipe: (recipeId: string) => RecipeComment[];
  listReports: () => CommentReport[];
  addComment: (args: { author: PublicUser; recipeId: string; content: string; rating: 1 | 2 | 3 | 4 | 5 }) => RecipeComment;
  editComment: (commentId: string, authorId: string, content: string) => RecipeComment;
  deleteComment: (commentId: string, deleter: PublicUser) => void;
  toggleLike: (commentId: string, userId: string) => RecipeComment | null;
  reportComment: (args: { commentId: string; recipeId: string; reporterId: string; reason: string }) => CommentReport;
  resolveReport: (reportId: string, resolverId: string, dismissed?: boolean) => void;
}

const CommentContext = createContext<CommentContextValue | null>(null);

interface CommentStore {
  byRecipe: Record<string, RecipeComment[]>;
  reports: CommentReport[];
}

function emptyStore(): CommentStore {
  return { byRecipe: {}, reports: [] };
}

function loadStore(): CommentStore {
  const stored = getJsonStorage<CommentStore>(STORAGE_KEYS.comments);
  if (!stored || typeof stored !== 'object' || !stored.byRecipe || !Array.isArray(stored.reports)) {
    const seed = emptyStore();
    setJsonStorage(STORAGE_KEYS.comments, seed);
    return seed;
  }
  return stored;
}

function saveStore(store: CommentStore): void {
  setJsonStorage(STORAGE_KEYS.comments, store);
}

function loadReportsFallback(): CommentReport[] {
  const stored = getJsonStorage<CommentReport[]>(STORAGE_KEYS.reports);
  return Array.isArray(stored) ? stored : [];
}

function saveReportsFallback(list: CommentReport[]): void {
  setJsonStorage(STORAGE_KEYS.reports, list);
}

function createCommentId(): string {
  return `comment-${crypto.randomUUID()}`;
}

function createReportId(): string {
  return `report-${crypto.randomUUID()}`;
}

export function CommentProvider({ children }: { children: ReactNode }) {
  const listForRecipe = useCallback((recipeId: string): RecipeComment[] => {
    const store = loadStore();
    const list = store.byRecipe[recipeId] ?? [];
    return [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, []);

  const listReports = useCallback((): CommentReport[] => {
    const store = loadStore();
    const a = store.reports;
    const b = loadReportsFallback();
    const merged = new Map<string, CommentReport>();
    for (const r of [...a, ...b]) merged.set(r.id, r);
    return [...merged.values()].sort(
      (x, y) => +new Date(y.createdAt) - +new Date(x.createdAt),
    );
  }, []);

  const addComment = useCallback<CommentContextValue['addComment']>(({ author, recipeId, content, rating }) => {
    const clean = content.trim();
    if (clean.length === 0) {
      throw new AppError('Comment empty', 'COMMENT_EMPTY');
    }
    if (rating < 1 || rating > 5) {
      throw new AppError('Invalid rating', 'COMMENT_RATING');
    }
    const store = loadStore();
    const comment: RecipeComment = {
      id: createCommentId(),
      recipeId,
      authorId: author.id,
      authorName: author.name,
      authorAvatar: author.avatar,
      content: clean,
      rating,
      likes: 0,
      likedBy: [],
      reportCount: 0,
      reportedBy: [],
      createdAt: new Date().toISOString(),
    };
    const list = store.byRecipe[recipeId] ?? [];
    list.push(comment);
    store.byRecipe[recipeId] = list;
    saveStore(store);
    return comment;
  }, []);

  const editComment = useCallback((commentId: string, authorId: string, content: string): RecipeComment => {
    const clean = content.trim();
    if (clean.length === 0) {
      throw new AppError('Comment empty', 'COMMENT_EMPTY');
    }
    const store = loadStore();
    for (const recipeId of Object.keys(store.byRecipe)) {
      const list = store.byRecipe[recipeId];
      for (let i = 0; i < list.length; i += 1) {
        const c = list[i];
        if (c.id === commentId) {
          if (c.authorId !== authorId) {
            throw new AppError('Cannot edit other user comment', 'COMMENT_NOT_OWNER');
          }
          const updated: RecipeComment = {
            ...c,
            content: clean,
            editedAt: new Date().toISOString(),
          };
          list[i] = updated;
          saveStore(store);
          return updated;
        }
      }
    }
    throw new AppError('Comment not found', 'COMMENT_NOT_FOUND');
  }, []);

  const deleteComment = useCallback((commentId: string, deleter: PublicUser): void => {
    const store = loadStore();
    for (const recipeId of Object.keys(store.byRecipe)) {
      const list = store.byRecipe[recipeId];
      const idx = list.findIndex((c) => c.id === commentId);
      if (idx !== -1) {
        const c = list[idx];
        const allowed = c.authorId === deleter.id || deleter.role === 'admin';
        if (!allowed) {
          throw new AppError('Cannot delete other user comment', 'COMMENT_NOT_OWNER');
        }
        list.splice(idx, 1);
        store.byRecipe[recipeId] = list;
        saveStore(store);
        return;
      }
    }
  }, []);

  const toggleLike = useCallback((commentId: string, userId: string): RecipeComment | null => {
    const store = loadStore();
    for (const recipeId of Object.keys(store.byRecipe)) {
      const list = store.byRecipe[recipeId];
      for (let i = 0; i < list.length; i += 1) {
        const c = list[i];
        if (c.id === commentId) {
          const liked = c.likedBy.includes(userId);
          const likedBy = liked ? c.likedBy.filter((id) => id !== userId) : [...c.likedBy, userId];
          const updated: RecipeComment = {
            ...c,
            likedBy,
            likes: likedBy.length,
          };
          list[i] = updated;
          saveStore(store);
          return updated;
        }
      }
    }
    return null;
  }, []);

  const reportComment = useCallback<CommentContextValue['reportComment']>(({ commentId, recipeId, reporterId, reason }) => {
    const clean = reason.trim();
    if (clean.length === 0) throw new AppError('Reason empty', 'REPORT_REASON_EMPTY');
    const store = loadStore();
    let target: RecipeComment | null = null;
    for (const rid of Object.keys(store.byRecipe)) {
      const found = store.byRecipe[rid].find((c) => c.id === commentId);
      if (found) {
        target = found;
        break;
      }
    }
    if (!target) throw new AppError('Comment not found', 'COMMENT_NOT_FOUND');
    if (target.reportedBy.includes(reporterId)) {
      throw new AppError('Already reported', 'ALREADY_REPORTED');
    }
    target.reportedBy = [...target.reportedBy, reporterId];
    target.reportCount = target.reportedBy.length;
    target.isReported = true;
    const report: CommentReport = {
      id: createReportId(),
      commentId,
      recipeId,
      reporterId,
      reason: clean,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    store.reports = [report, ...store.reports];
    saveStore(store);

    const fallbackList = loadReportsFallback();
    fallbackList.unshift(report);
    saveReportsFallback(fallbackList.slice(0, 500));

    return report;
  }, []);

  const resolveReport = useCallback(
    (reportId: string, resolverId: string, dismissed: boolean = false): void => {
      const store = loadStore();
      const idx = store.reports.findIndex((r) => r.id === reportId);
      const now = new Date().toISOString();
      if (idx !== -1) {
        store.reports[idx] = {
          ...store.reports[idx],
          status: dismissed ? 'dismissed' : 'resolved',
          resolvedAt: now,
          resolvedBy: resolverId,
        };
      }
      const fallbackList = loadReportsFallback();
      const idx2 = fallbackList.findIndex((r) => r.id === reportId);
      if (idx2 !== -1) {
        fallbackList[idx2] = {
          ...fallbackList[idx2],
          status: dismissed ? 'dismissed' : 'resolved',
          resolvedAt: now,
          resolvedBy: resolverId,
        };
        saveReportsFallback(fallbackList);
      }
      saveStore(store);
    },
    [],
  );

  const value = useMemo<CommentContextValue>(
    () => ({
      listForRecipe,
      listReports,
      addComment,
      editComment,
      deleteComment,
      toggleLike,
      reportComment,
      resolveReport,
    }),
    [
      listForRecipe,
      listReports,
      addComment,
      editComment,
      deleteComment,
      toggleLike,
      reportComment,
      resolveReport,
    ],
  );

  return <CommentContext.Provider value={value}>{children}</CommentContext.Provider>;
}

export function useComment(): CommentContextValue {
  const ctx = useContext(CommentContext);
  if (!ctx) throw new Error('useComment must be used within CommentProvider');
  return ctx;
}

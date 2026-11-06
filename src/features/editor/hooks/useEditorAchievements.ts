import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import type { Achievement } from '@/data/types';
import {
  loadEditorAchievementSubmissions,
  mergeAchievementCatalogue,
  saveEditorAchievementSubmissions,
  type EditorAchievementSubmission,
} from '@/features/achievements/lib/catalogue';
import { createRecipeSlugId } from '@/lib/slug';

export interface UseEditorAchievements {
  editorId: string;
  /** Achievements this editor submitted for review, newest first. */
  mySubmissions: EditorAchievementSubmission[];
  /** Live catalogue entries credited to this editor (the 33 seeds for the
   * demo editor, plus their approved submissions), excluding submissions
   * already shown above. */
  myCatalogueEntries: Achievement[];
  pendingCount: number;
  createdCount: number;
  createSubmission: (achievement: Omit<Achievement, 'id' | 'createdBy'>) => EditorAchievementSubmission;
  refresh: () => void;
}

export function useEditorAchievements(): UseEditorAchievements {
  const { user } = useAuth();
  const editorId = user?.id ?? '';
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((x) => x + 1), []);

  // Another tab (e.g. the admin approving) may change the stores.
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onFocus);
    };
  }, [refresh]);

  const { mySubmissions, myCatalogueEntries, pendingCount, createdCount } = useMemo(() => {
    void tick;
    const submissions = loadEditorAchievementSubmissions();
    const mine = submissions
      .filter((sub) => sub.submittedBy === editorId)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    const mineIds = new Set(mine.map((sub) => sub.achievement.id));
    const catalogue = mergeAchievementCatalogue().filter(
      (a) => a.createdBy === editorId && !mineIds.has(a.id),
    );
    return {
      mySubmissions: mine,
      myCatalogueEntries: catalogue,
      pendingCount: mine.filter((sub) => sub.status === 'pending').length,
      createdCount: mine.length + catalogue.length,
    };
  }, [editorId, tick]);

  const createSubmission = useCallback<UseEditorAchievements['createSubmission']>(
    (draft) => {
      const achievement: Achievement = {
        ...draft,
        id: `ach-editor-${createRecipeSlugId(draft.name)}`,
        createdBy: editorId,
      };
      const submission: EditorAchievementSubmission = {
        achievement,
        status: 'pending',
        submittedBy: editorId,
        submittedAt: new Date().toISOString(),
      };
      const all = loadEditorAchievementSubmissions();
      saveEditorAchievementSubmissions([...all, submission]);
      refresh();
      return submission;
    },
    [editorId, refresh],
  );

  return {
    editorId,
    mySubmissions,
    myCatalogueEntries,
    pendingCount,
    createdCount,
    createSubmission,
    refresh,
  };
}

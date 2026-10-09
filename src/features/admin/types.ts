export type AuditAction =
  | 'user.create'
  | 'user.update'
  | 'user.ban'
  | 'user.unban'
  | 'user.delete'
  | 'user.warning'
  | 'recipe.approve'
  | 'recipe.reject'
  | 'recipe.delete'
  | 'achievement.create'
  | 'achievement.update'
  | 'achievement.delete'
  | 'achievement.unlock'
  | 'comment.delete'
  | 'report.resolve'
  | 'appeal.accept'
  | 'appeal.reject'
  | 'setting.update'
  | 'backup.export'
  | 'backup.import'
  | 'broadcast.send';

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorRole: 'player' | 'support' | 'editor' | 'admin';
  action: AuditAction;
  targetId?: string;
  targetType?: 'user' | 'recipe' | 'achievement' | 'comment' | 'appeal' | 'report' | 'setting' | 'broadcast';
  detail: Record<string, unknown>;
  createdAt: string;
}

export interface AdminDashboardStats {
  playerCount: number;
  editorCount: number;
  supportCount: number;
  adminCount: number;
  bannedCount: number;
  recipeCount: number;
  pendingRecipeCount: number;
  appealCount: number;
  openAppealCount: number;
  unlockedAchievementsSum: number;
  reportCount: number;
  openReportCount: number;
}

export interface AdminSettings {
  maxUploadMB: number;
  afkTimeoutSeconds: number;
  autoBanAfterWarnings: number;
  maxRecipeScore: number;
  maintenanceMode: boolean;
}

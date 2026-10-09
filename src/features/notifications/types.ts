export type NotificationType =
  | 'recipe.approved'
  | 'recipe.rejected'
  | 'recipe.comment'
  | 'achievement.unlocked'
  | 'mail.new'
  | 'ban.notice'
  | 'warning.count'
  | 'support.reply'
  | 'appeal.created'
  | 'appeal.accepted'
  | 'appeal.rejected'
  | 'broadcast.received';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  readAt?: string;
  link?: string;
  relatedId?: string;
  createdAt: string;
}

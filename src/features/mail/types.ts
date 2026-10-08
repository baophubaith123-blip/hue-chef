export type MailType =
  | 'broadcast'
  | 'ban-notice'
  | 'warning'
  | 'support'
  | 'recipe-approved'
  | 'recipe-rejected';

export interface MailMessage {
  id: string;
  userId: string;
  type: MailType;
  subject: string;
  body: string;
  createdAt: string;
  read: boolean;
  recipeId?: string;
  rejectionReason?: string;
  appealId?: string;
  threadId?: string;
  banReason?: string;
  banUntil?: string;
  warningCount?: number;
  broadcastTarget?: string;
  senderId?: string;
}

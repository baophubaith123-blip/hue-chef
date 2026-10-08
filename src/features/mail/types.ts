export type MailType = 'recipe-approved' | 'recipe-rejected';

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
}

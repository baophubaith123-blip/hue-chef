import type { UserRole } from '@/features/auth/types';

export type AppealType = 'ban' | 'warning' | 'account' | 'recipe' | 'other';

export type AppealStatus = 'open' | 'recommended' | 'rejected' | 'resolved';

export interface ChatThread {
  id: string;
  participantIds: string[];
  starterRole: UserRole;
  subject: string;
  createdAt: string;
  lastMessageAt: string;
  closed: boolean;
  closedAt?: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  attachments: ChatAttachment[];
  createdAt: string;
  read: boolean;
}

export interface ChatAttachment {
  id: string;
  name: string;
  sizeKB: number;
  type: string;
  dataUrl: string;
}

export interface Appeal {
  id: string;
  threadId: string;
  appellantId: string;
  type: AppealType;
  subject: string;
  summary: string;
  status: AppealStatus;
  supportId?: string;
  adminId?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

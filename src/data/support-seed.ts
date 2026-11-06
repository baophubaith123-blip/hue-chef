import type { Appeal, ChatMessage, ChatThread } from '@/features/support/types';

// Seed support data so a fresh install shows a living support area: one
// banned player (seed-banned-player in users.ts) with an open ban appeal
// and a conversation with the support agent.
export const SEED_THREADS: ChatThread[] = [
  {
    id: 'thread-seed-ban',
    participantIds: ['seed-banned-player', 'seed-support'],
    starterRole: 'player',
    subject: 'Tài khoản bị khóa - xin xem xét',
    createdAt: '2026-11-04T09:12:00.000Z',
    lastMessageAt: '2026-11-04T10:05:00.000Z',
    closed: false,
  },
];

export const SEED_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-seed-ban-1',
    threadId: 'thread-seed-ban',
    senderId: 'seed-banned-player',
    content:
      'Chào đội hỗ trợ, tài khoản của tôi bị khóa vì nghi ngờ gian lận điểm số. Tôi không dùng phần mềm gì cả, hôm đó tôi chơi trên máy ở quán net và mạng lag nên điểm nhảy bất thường. Mong đội xem xét giúp tôi.',
    attachments: [],
    createdAt: '2026-11-04T09:12:00.000Z',
    read: true,
  },
  {
    id: 'msg-seed-ban-2',
    threadId: 'thread-seed-ban',
    senderId: 'seed-support',
    content:
      'Chào bạn, đội hỗ trợ đã nhận được phản hồi. Bạn cho mình xin thêm thông tin: bạn thường chơi vào khung giờ nào và có đăng nhập trên thiết bị khác không?',
    attachments: [],
    createdAt: '2026-11-04T09:40:00.000Z',
    read: true,
  },
  {
    id: 'msg-seed-ban-3',
    threadId: 'thread-seed-ban',
    senderId: 'seed-banned-player',
    content:
      'Tôi thường chơi buổi tối 20h-22h trên điện thoại của mình. Hôm bị khóa là lần duy nhất tôi chơi nhờ máy tính ở quán. Cảm ơn đội hỗ trợ!',
    attachments: [],
    createdAt: '2026-11-04T10:05:00.000Z',
    read: false,
  },
];

export const SEED_APPEALS: Appeal[] = [
  {
    id: 'appeal-seed-ban',
    threadId: 'thread-seed-ban',
    appellantId: 'seed-banned-player',
    type: 'ban',
    subject: 'Xin xem xét mở khóa tài khoản',
    summary:
      'Người chơi khẳng định không gian lận, điểm bất thường do chơi trên máy lạ với mạng lag. Đã cung cấp thêm thông tin thiết bị và khung giờ chơi, chờ quản trị viên quyết định.',
    status: 'open',
    createdAt: '2026-11-04T10:06:00.000Z',
    updatedAt: '2026-11-04T10:06:00.000Z',
  },
];

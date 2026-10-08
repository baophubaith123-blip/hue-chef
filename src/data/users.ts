import type { StoredUser } from '@/features/auth/types';

const now = new Date().toISOString();

export const SEED_USERS: StoredUser[] = [
  {
    id: 'seed-player',
    name: 'Người Chơi Demo',
    email: 'player@hue.vn',
    password: 'player123',
    role: 'player',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player',
    status: 'active',
    createdAt: now,
    level: 1,
    exp: 0,
    maxExp: 1000,
    cookedRecipes: [],
    unlockedAchievements: [],
    warningCount: 0,
  },
  {
    id: 'seed-support',
    name: 'Hỗ Trợ Viên Demo',
    email: 'support@hue.vn',
    password: 'support123',
    role: 'support',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=support',
    status: 'active',
    createdAt: now,
  },
  {
    id: 'seed-editor',
    name: 'Editor Demo',
    email: 'editor@hue.vn',
    password: 'editor123',
    role: 'editor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=editor',
    status: 'active',
    createdAt: now,
    bio: 'Đầu bếp sáng tạo công thức Huế',
    recipeCount: 0,
  },
  {
    id: 'seed-admin',
    name: 'Admin Demo',
    email: 'admin@hue.vn',
    password: 'admin123',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    status: 'active',
    createdAt: now,
  },
];

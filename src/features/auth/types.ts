export type UserRole = 'player' | 'support' | 'editor' | 'admin';

export type UserStatus = 'active' | 'banned';

export interface CookedRecipeEntry {
  recipeId: string;
  recipeName: string;
  score: number;
  stars: 1 | 2 | 3 | 4 | 5;
  timeUsed: number;
  cookedAt: string;
  image: string;
  category?: string;
}

export interface PlayerProfile {
  level: number;
  exp: number;
  maxExp: number;
  cookedRecipes: CookedRecipeEntry[];
  unlockedAchievements: string[];
  warningCount: number;
}

export interface EditorProfile {
  bio?: string;
  recipeCount: number;
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar: string;
  status: UserStatus;
  createdAt: string;
  level?: number;
  exp?: number;
  maxExp?: number;
  cookedRecipes?: CookedRecipeEntry[];
  unlockedAchievements?: string[];
  warningCount?: number;
  bio?: string;
  recipeCount?: number;
  equippedAchievementId?: string | null;
}

export interface AuthSession {
  userId: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  status: UserStatus;
  createdAt: string;
  level?: number;
  exp?: number;
  maxExp?: number;
  cookedRecipes?: CookedRecipeEntry[];
  unlockedAchievements?: string[];
  warningCount?: number;
  bio?: string;
  recipeCount?: number;
  equippedAchievementId?: string | null;
}

export function toPublicUser(user: StoredUser): PublicUser {
  const { password: _password, ...rest } = user;
  return rest;
}

export function getDefaultPathForRole(role: UserRole): string {
  switch (role) {
    case 'support':
      return '/support';
    case 'editor':
      return '/editor';
    case 'admin':
      return '/admin';
    case 'player':
    default:
      return '/';
  }
}

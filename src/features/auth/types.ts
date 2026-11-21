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
  coins: number;
  ownedRecipeIds: string[];
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
  coins?: number;
  /** Lifetime coins ever earned (spending does not reduce it). */
  totalCoinsEarned?: number;
  /** Cok — the rare ruby currency of the sell loop (Kế hoạch hợp nhất,
   * mục 6.8): paid only by VIP customers at the stall. Absent on legacy
   * records, which simply means a balance of 0. */
  cok?: number;
  ownedRecipeIds?: string[];
  cookedRecipes?: CookedRecipeEntry[];
  unlockedAchievements?: string[];
  /** LEGACY chapter-wide sell licenses (luật H3 cũ): chapter ids whose
   * boss granted the sell license for EVERY dish of the chapter. Since
   * the per-dish boss law (Bảo chốt 2026-11-20) no new record earns
   * these; a stored entry is read as a conversion source — it implies
   * the chapter boss was beaten AND a dish license for every dish of
   * that chapter (see journey/lib). Absent = none held. */
  sellLicenses?: string[];
  /** Per-dish sell licenses (luật trùm theo món, Bảo chốt 2026-11-20):
   * recipe ids whose own boss stage was beaten — only these dishes may
   * be sold at the stall. Earned only by dish-boss wins (plus the legacy
   * conversion above). Absent on legacy records = none yet. */
  dishLicenses?: string[];
  /** Chapter ids whose Ngự thiện chapter boss was beaten (luật mới):
   * the area-unlock milestone of the journey — it no longer grants any
   * sell license by itself. Legacy sellLicenses entries also count as
   * clears, since those players did beat the boss. Absent = none. */
  bossClears?: string[];
  warningCount?: number;
  bio?: string;
  recipeCount?: number;
  equippedAchievementId?: string | null;
  /** Why the account is banned (set when status === 'banned'). */
  banReason?: string;
  /** Ban expiry date (yyyy-mm-dd); null/undefined = permanent ban. */
  banUntil?: string | null;
  /** Guest profile (Gói Game-Shell): auto-created local profile for
   *  instant play from the title screen. Guests play the full local
   *  game but never appear on any leaderboard; on login/register the
   *  guest progress merges into the account (union law) and the guest
   *  record is consumed. Absent on legacy records = not a guest. */
  guest?: boolean;
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
  coins?: number;
  /** Lifetime coins ever earned (spending does not reduce it). */
  totalCoinsEarned?: number;
  /** Cok — the rare ruby currency of the sell loop (mục 6.8). */
  cok?: number;
  ownedRecipeIds?: string[];
  cookedRecipes?: CookedRecipeEntry[];
  unlockedAchievements?: string[];
  /** LEGACY chapter-wide sell licenses — see StoredUser.sellLicenses. */
  sellLicenses?: string[];
  /** Per-dish sell licenses (recipe ids) — see StoredUser.dishLicenses. */
  dishLicenses?: string[];
  /** Chapter boss clears (chapter ids) — see StoredUser.bossClears. */
  bossClears?: string[];
  warningCount?: number;
  bio?: string;
  recipeCount?: number;
  equippedAchievementId?: string | null;
  /** Why the account is banned (set when status === 'banned'). */
  banReason?: string;
  /** Ban expiry date (yyyy-mm-dd); null/undefined = permanent ban. */
  banUntil?: string | null;
  /** Guest profile flag — see StoredUser.guest. */
  guest?: boolean;
}

/** True while a ban is in force; a dated ban stops applying after its last day. */
export function isBanActive(
  user: Pick<StoredUser, 'status' | 'banUntil'>,
  now: Date = new Date(),
): boolean {
  if (user.status !== 'banned') return false;
  if (!user.banUntil) return true;
  return new Date(`${user.banUntil}T23:59:59`) >= now;
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
      return '/home';
  }
}

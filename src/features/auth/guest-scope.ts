import type { PublicUser } from '@/features/auth/types';

/**
 * GUEST SCOPE — the single configuration for everything a guest profile
 * may or may not do (Bảo's chốt, Gói Game-Shell). To change the guest
 * boundary, edit ONLY this file: the game shell gate, the home panels
 * and the navigation all read from here.
 *
 * Guests may: the home hub, the recipe loop (list, detail, the full
 * 5-stage learning run), the Hue map (the learning road whose bosses
 * grant sell licenses) and the full sell loop (stall + market, incl.
 * staff / upgrades / night festival inside the stall).
 *
 * Everything else in the player area requires an account: tapping a
 * blocked destination shows the "Cần tài khoản" game panel instead of
 * navigating inside.
 */
export const GUEST_ALLOWED_PREFIXES: readonly string[] = [
  '/home',
  '/recipes',
  '/cooking',
  '/map',
  '/stall',
  '/market',
];

export function isGuestUser(user: PublicUser | null | undefined): boolean {
  return Boolean(user?.guest);
}

/** Exact-or-child prefix match, so '/map' never swallows '/market'. */
export function isGuestPathAllowed(pathname: string): boolean {
  return GUEST_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isGuestBlocked(user: PublicUser | null | undefined, pathname: string): boolean {
  return isGuestUser(user) && !isGuestPathAllowed(pathname);
}

import { shiftDurationMs, shiftQuotaForStars } from '@/features/stall/lib/pricing-sell';
import { rankForOrders, type StaffRole } from '@/features/stall/lib/support';
import type { StaffMember } from '@/features/stall/types';

/**
 * Away-from-stall selling (Kế hoạch hợp nhất, mục 5.9 — Bảo's chốt,
 * never loosened): the stall only sells while the player is away when
 * BOTH conditions hold at once —
 *   (a) the essential crew is hired: at least one cook (phụ bếp) AND
 *       at least one seller (phục vụ / thu ngân / quản lý quầy);
 *   (b) the pantry still covers at least one dish on the on-sale menu.
 * The game NEVER buys ingredients on its own: when the last cookable
 * dish runs out, the stall closes and waits for the player.
 *
 * "Away" is measured from the last moment the stall was tended (any
 * stall store write — the stall/market/sell-cook screens tick it
 * fresh every second), so time spent in the learning loop also counts:
 * the crew minds the shop while the owner studies. Efficiency is
 * 50–70% of live play (chốt N2), wages keep running by game day, and
 * AFK service earns xu/cok but no stall EXP — reputation is earned in
 * person.
 */

/** Shorter absences are just a page hop, not an AFK session. */
export const AFK_MIN_AWAY_MS = 180_000;

/** Hard cap on simulated customers per settlement (performance guard). */
export const AFK_MAX_CUSTOMERS = 4000;

/** Share of AFK orders whose customer walks before the dish lands. */
export const AFK_WALK_AWAY_RATE = 0.08;

export interface AfkEssential {
  cook: boolean;
  seller: boolean;
  ok: boolean;
}

export function afkEssentialFor(staff: StaffMember[]): AfkEssential {
  const has = (role: StaffRole) => staff.some((member) => member.role === role);
  const cook = has('cook');
  const seller = has('server') || has('cashier') || has('manager');
  return { cook, seller, ok: cook && seller };
}

/**
 * AFK efficiency inside the chốt band 50–70%: the base crew runs at
 * half pace; a manager lifts the whole shift (+10, plus +5 per rank);
 * a kỳ-cựu server adds the last +5. Never above 0.70, never below 0.50.
 */
export function afkEfficiencyFor(staff: StaffMember[]): number {
  let efficiency = 0.5;
  const manager = staff.find((member) => member.role === 'manager');
  if (manager) efficiency += 0.1 + 0.05 * rankForOrders(manager.ordersDone);
  const server = staff.find((member) => member.role === 'server');
  if (server && rankForOrders(server.ordersDone) === 2) efficiency += 0.05;
  return Math.min(0.7, Math.max(0.5, efficiency));
}

/**
 * Mean time between AFK customers: the live shift's own mean spawn
 * interval (shift length ÷ shift quota — the phase factors of the
 * live rhythm average out to ≈1 over a whole shift) stretched by the
 * efficiency, so the AFK customer rate is exactly `efficiency` × the
 * live rate at EVERY star level (H10 balance pass, from H4–H6 play
 * data). The old flat 90 s base drifted as stars rose: ≈47% of live
 * at 1 star but ≈103% at 5 stars with a kỳ-cựu crew (efficiency 0.7)
 * — AFK could out-serve live play, breaking chốt N2 (50–70%) and the
 * plan's rule that AFK always earns less than playing in person.
 */
export function afkCustomerIntervalMs(stars: number, efficiency: number): number {
  const s = Math.min(5, Math.max(1, stars));
  const liveIntervalMs = shiftDurationMs(s) / Math.max(1, shiftQuotaForStars(s));
  return Math.round(liveIntervalMs / Math.max(0.1, efficiency));
}

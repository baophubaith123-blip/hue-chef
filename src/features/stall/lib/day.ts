/**
 * Game-day helpers for the sell loop. A "game day" is the player's local
 * calendar day: market prices reseed and pantry lots age at midnight,
 * with no server clock involved (Kế hoạch hợp nhất, mục 5.8 / 6.1).
 */

export function dayKeyOf(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey(now: Date = new Date()): string {
  return dayKeyOf(now);
}

export function addDays(dayKey: string, days: number): string {
  const [y, m, d] = dayKey.split('-').map((part) => Number(part));
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  return dayKeyOf(date);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function dayDiff(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map((part) => Number(part));
  const [ty, tm, td] = to.split('-').map((part) => Number(part));
  const a = Date.UTC(fy, (fm ?? 1) - 1, fd ?? 1);
  const b = Date.UTC(ty, (tm ?? 1) - 1, td ?? 1);
  return Math.round((b - a) / 86_400_000);
}

/** Deterministic 0..1 value from a string seed (FNV-1a + xorshift). */
export function seededUnit(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0x5bd1e995);
  hash ^= hash >>> 15;
  return (hash >>> 0) / 0x1_0000_0000;
}

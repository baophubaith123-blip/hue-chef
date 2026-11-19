import { SEED_RECIPES } from '@/data/recipes';

/**
 * Weekly tournament calendar (Gói H9, ý tưởng 21): one shared dish
 * per ISO week (Monday–Sunday), derived deterministically on every
 * client — no schedule table, no server clock. "The week" is always
 * read on the Asia/Bangkok wall clock (UTC+7, no DST): a run played
 * at 00:30 Bangkok on a Monday belongs to the new week even though
 * UTC is still on Sunday.
 *
 * Implementation note: all week maths runs on a shifted instant —
 * the UTC fields of (instant + 7h) ARE the Bangkok wall fields — so
 * plain UTC date arithmetic gives Bangkok calendar results without
 * any timezone database.
 */

const BANGKOK_OFFSET_MS = 7 * 3_600_000;
const DAY_MS = 86_400_000;

interface WallDate {
  year: number;
  month: number; // 0-based
  day: number;
  /** Monday = 0 … Sunday = 6. */
  dow: number;
}

function wallDateOf(date: Date): WallDate {
  const shifted = new Date(date.getTime() + BANGKOK_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    dow: (shifted.getUTCDay() + 6) % 7,
  };
}

function utcMidnightMs(year: number, month: number, day: number): number {
  return Date.UTC(year, month, day);
}

/** ISO week + ISO year of a Bangkok wall date (Thursday rule). */
function isoWeekOf(wall: WallDate): { isoYear: number; week: number } {
  const mondayMs = utcMidnightMs(wall.year, wall.month, wall.day) - wall.dow * DAY_MS;
  const thursdayMs = mondayMs + 3 * DAY_MS;
  const thursday = new Date(thursdayMs);
  const isoYear = thursday.getUTCFullYear();
  const jan1Ms = utcMidnightMs(isoYear, 0, 1);
  const week = Math.floor((thursdayMs - jan1Ms) / (7 * DAY_MS)) + 1;
  return { isoYear, week };
}

export function weekKeyForDate(date: Date): string {
  const { isoYear, week } = isoWeekOf(wallDateOf(date));
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

export function currentWeekKey(now: Date = new Date()): string {
  return weekKeyForDate(now);
}

/** Monday 00:00 +07 (as a UTC-shifted midnight) of an ISO week. */
function mondayWallMs(isoYear: number, week: number): number {
  // 4 January always lies in ISO week 1; its Monday opens the year.
  const jan4Ms = utcMidnightMs(isoYear, 0, 4);
  const jan4Dow = (new Date(jan4Ms).getUTCDay() + 6) % 7;
  const week1MondayMs = jan4Ms - jan4Dow * DAY_MS;
  return week1MondayMs + (week - 1) * 7 * DAY_MS;
}

export function weekWindow(weekKey: string): { opensAt: Date; closesAt: Date } {
  const match = /^(\d{4})-W(\d{1,2})$/.exec(weekKey);
  const isoYear = match ? Number(match[1]) : new Date().getUTCFullYear();
  const week = match ? Number(match[2]) : 1;
  // Wall midnights are UTC midnights of the shifted clock; the real
  // instant is 7 hours earlier.
  const opensMs = mondayWallMs(isoYear, week) - BANGKOK_OFFSET_MS;
  const closesMs = opensMs + 7 * DAY_MS - 1;
  return { opensAt: new Date(opensMs), closesAt: new Date(closesMs) };
}

export function isTournamentOpen(now: Date = new Date()): boolean {
  const { opensAt, closesAt } = weekWindow(currentWeekKey(now));
  const t = now.getTime();
  return t >= opensAt.getTime() && t <= closesAt.getTime();
}

/** FNV-1a over the week key — the same family as lib/day's seededUnit. */
function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

const SORTED_RECIPE_IDS: string[] = SEED_RECIPES.map((recipe) => recipe.id).sort();

/** The one dish of a tournament week — identical on every machine. */
export function tournamentRecipeId(weekKey: string): string {
  if (SORTED_RECIPE_IDS.length === 0) return '';
  return SORTED_RECIPE_IDS[fnv1a(weekKey) % SORTED_RECIPE_IDS.length] ?? '';
}

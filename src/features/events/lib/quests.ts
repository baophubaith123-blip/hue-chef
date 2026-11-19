import { seededUnit } from '@/features/stall/lib/day';
import type { QuestMetric } from '@/features/events/types';

/**
 * Quest book (Gói H7, ý tưởng 2 — Kế hoạch hợp nhất Phần 7): daily and
 * weekly quests are drawn deterministically from the pools below by
 * the game day / week key, so every player sees the same board on the
 * same day and a reload never reshuffles it. Progress is fed by real
 * play events from BOTH loops through the events store
 * (recordPlayEvent): learning cooks, stall serves, market buys.
 *
 * Rewards are xu only. Cok never flows through quests — its secondary
 * sources are the check-in's day 7 and the festival bonus, both capped
 * by design (chốt N1/M1, see lib/checkin and the stall store).
 */

export interface QuestDef {
  id: string;
  metric: QuestMetric;
  target: number;
  rewardXu: number;
}

export const DAILY_QUEST_POOL: QuestDef[] = [
  { id: 'd-cook-2', metric: 'cook-any', target: 2, rewardXu: 40 },
  { id: 'd-cook-star3', metric: 'cook-star3', target: 1, rewardXu: 50 },
  { id: 'd-serve-3', metric: 'serve-any', target: 3, rewardXu: 45 },
  { id: 'd-serve-ok-2', metric: 'serve-ok', target: 2, rewardXu: 55 },
  { id: 'd-earn-150', metric: 'earn-xu', target: 150, rewardXu: 40 },
  { id: 'd-buy-3', metric: 'buy-actions', target: 3, rewardXu: 35 },
  { id: 'd-dotd-1', metric: 'dotd-any', target: 1, rewardXu: 60 },
];

export const WEEKLY_QUEST_POOL: QuestDef[] = [
  { id: 'w-cook-8', metric: 'cook-any', target: 8, rewardXu: 180 },
  { id: 'w-serve-12', metric: 'serve-any', target: 12, rewardXu: 200 },
  { id: 'w-earn-800', metric: 'earn-xu', target: 800, rewardXu: 220 },
  { id: 'w-star3-4', metric: 'cook-star3', target: 4, rewardXu: 190 },
  { id: 'w-vip-1', metric: 'serve-vip', target: 1, rewardXu: 160 },
  { id: 'w-dotd-3', metric: 'dotd-any', target: 3, rewardXu: 240 },
];

export const DAILY_QUEST_COUNT = 3;
export const WEEKLY_QUEST_COUNT = 3;

export function questDefById(id: string): QuestDef | null {
  return (
    DAILY_QUEST_POOL.find((def) => def.id === id) ??
    WEEKLY_QUEST_POOL.find((def) => def.id === id) ??
    CHAIN_STEPS.find((def) => def.id === id) ??
    null
  );
}

/** Deterministic draw of `count` distinct defs from a pool by seed. */
function drawQuests(pool: QuestDef[], count: number, seed: string): QuestDef[] {
  const remaining = [...pool];
  const picked: QuestDef[] = [];
  for (let i = 0; i < count && remaining.length > 0; i += 1) {
    const idx = Math.floor(seededUnit(`${seed}:${i}`) * remaining.length);
    const def = remaining.splice(idx, 1)[0];
    if (def) picked.push(def);
  }
  return picked;
}

export function dailyQuestsFor(dayKey: string): QuestDef[] {
  return drawQuests(DAILY_QUEST_POOL, DAILY_QUEST_COUNT, `daily:${dayKey}`);
}

export function weeklyQuestsFor(weekKey: string): QuestDef[] {
  return drawQuests(WEEKLY_QUEST_POOL, WEEKLY_QUEST_COUNT, `weekly:${weekKey}`);
}

/** Monday (yyyy-mm-dd) of the week containing `dayKey` — the week key. */
export function weekKeyOf(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map((part) => Number(part));
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  const dow = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - dow);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * The quest chain (chuỗi nhiệm vụ mở rương): five sequential steps
 * alternating the two loops, each bigger than a daily quest. Only the
 * current step accrues progress. Finishing all five opens the chest.
 */
export const CHAIN_STEPS: QuestDef[] = [
  { id: 'c-distinct-3', metric: 'cook-distinct', target: 3, rewardXu: 0 },
  { id: 'c-serve-10', metric: 'serve-any', target: 10, rewardXu: 0 },
  { id: 'c-buy-10', metric: 'buy-actions', target: 10, rewardXu: 0 },
  { id: 'c-boss-1', metric: 'boss-win', target: 1, rewardXu: 0 },
  { id: 'c-earn-1000', metric: 'earn-xu', target: 1000, rewardXu: 0 },
];

/** Chest contents: a big xu purse plus two rescue cards (stall store). */
export const CHAIN_CHEST_XU = 500;
export const CHAIN_CHEST_CARDS: Array<'patience' | 'reseason'> = ['patience', 'reseason'];

/**
 * Night Festival shift + village feast rules (Gói H7, ý tưởng 21/22 —
 * Kế hoạch hợp nhất mục 5.5 / 6.10):
 *
 * — Festival shift: the player buys a ticket for 2 cok and opens a
 *   special shift instead of a normal one: customers arrive faster
 *   (spawn interval ÷ FESTIVAL_SPAWN_FACTOR), the shift quota grows
 *   (× FESTIVAL_QUOTA_FACTOR), VIPs show up more often
 *   (× FESTIVAL_VIP_BOOST on the tier roll) and every tip is
 *   × FESTIVAL_TIP_FACTOR. Serving at least FESTIVAL_BONUS_MIN_OK
 *   orders at Đạt chuẩn or better earns FESTIVAL_BONUS_COK back when
 *   the shift closes.
 *
 * — Trần N1 (the secondary-cok ceiling): the ticket costs 2 cok and
 *   the bonus pays back at most 1 cok, so a festival shift is NET
 *   NEGATIVE as a cok source — it can never be farmed for cok. The
 *   festival is a xu/tip event bought WITH cok, not a cok printer;
 *   VIP serves at the stall stay the main cok road, exactly as the
 *   plan's ≈1/4 secondary ceiling requires.
 *
 * — Village feast (đãi làng): one big pot of FEAST_QTY portions of a
 *   licensed dish, served to the whole village in a single event at
 *   FEAST_PRICE_FACTOR over the ordinary capital-law price, with a
 *   richer stall-EXP reward. Once per day, and it needs the Big Pot
 *   kitchen upgrade (the feast flow itself lives with the cooking
 *   page; serveFeast in the stall store books the sale).
 */

/** Cok price of one festival-shift ticket (trần N1: see header). */
export const FESTIVAL_TICKET_COK = 2;

/** Every tip during a festival shift is multiplied by this. */
export const FESTIVAL_TIP_FACTOR = 1.5;

/** Đạt chuẩn-or-better serves in one festival shift that earn the bonus. */
export const FESTIVAL_BONUS_MIN_OK = 5;

/** Cok handed back at closing when the bonus threshold is met. */
export const FESTIVAL_BONUS_COK = 1;

/** Festival shifts receive this multiple of the normal customer quota. */
export const FESTIVAL_QUOTA_FACTOR = 1.5;

/** Spawn intervals are divided by this during a festival shift. */
export const FESTIVAL_SPAWN_FACTOR = 1.6;

/** Extra multiplier on the VIP share of the tier roll at a festival. */
export const FESTIVAL_VIP_BOOST = 1.5;

/** Portions in one village-feast big pot. */
export const FEAST_QTY = 10;

/** Feast price over the ordinary capital-law price for the batch. */
export const FEAST_PRICE_FACTOR = 1.3;

/** Extra stall EXP a feast serve earns on top of its quality band. */
export const FEAST_EXP_BONUS = 20;

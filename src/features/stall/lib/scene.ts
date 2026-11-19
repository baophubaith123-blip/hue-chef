/**
 * Stall scene time-of-day (Kế hoạch hợp nhất, mục 5.5; Gói H8).
 * The painted stall reads differently after dark: from 18:00 to
 * 04:59 local time the scene wears the evening layer (warm dusk wash
 * + lantern glow), while a Night Festival shift always wears the
 * deeper festival night on top of it. Pure + exported for unit tests.
 */
export function isEveningAt(date: Date): boolean {
  const hour = date.getHours();
  return hour >= 18 || hour < 5;
}

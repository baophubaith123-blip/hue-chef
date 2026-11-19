/**
 * Game-shell asset registry (Gói Game-Shell): flat sheet-style painted
 * assets generated for the game frame — title sign, 9-slice frames,
 * buttons, medallions, garland and the painted icon set. Icons load via
 * a glob so a missing icon degrades to the caller's emoji fallback
 * instead of breaking the build.
 */
import signTitle from '@/assets/theme-d/game/sign-title.webp';
import frameScroll from '@/assets/theme-d/game/frame-scroll.webp';
import frameWood from '@/assets/theme-d/game/frame-wood.webp';
import paperTaped from '@/assets/theme-d/game/paper-taped.webp';
import btnGold from '@/assets/theme-d/game/btn-gold.webp';
import btnWood from '@/assets/theme-d/game/btn-wood.webp';
import btnBrick from '@/assets/theme-d/game/btn-brick.webp';
import btnPlay from '@/assets/theme-d/game/btn-play.webp';
import medallion from '@/assets/theme-d/game/medallion.webp';
import garlandStrip from '@/assets/theme-d/game/garland-strip.webp';
import garlandBottom from '@/assets/theme-d/game/garland-bottom.webp';
import signHero from '@/assets/theme-d/game/sign-hero.webp';
import btnPlayHero from '@/assets/theme-d/game/btn-play-hero.webp';
import tagHero from '@/assets/theme-d/game/tag-hero.webp';

import noiNoiPot from '@/assets/theme-d/noi-noi-flat/noinoi-pot.webp';
import noiNoiWave from '@/assets/theme-d/noi-noi-flat/noinoi-wave.webp';
import noiNoiCook from '@/assets/theme-d/noi-noi-flat/noinoi-cook.webp';
import noiNoiHappy from '@/assets/theme-d/noi-noi-flat/noinoi-happy.webp';
import noiNoiSad from '@/assets/theme-d/noi-noi-flat/noinoi-sad.webp';
import noiNoiSleep from '@/assets/theme-d/noi-noi-flat/noinoi-sleep.webp';

export const GAME_ART = {
  signTitle,
  frameScroll,
  frameWood,
  paperTaped,
  btnGold,
  btnWood,
  btnBrick,
  btnPlay,
  medallion,
  garlandStrip,
  garlandBottom,
  signHero,
  btnPlayHero,
  tagHero,
} as const;

export type NoiNoiFlatPose = 'pot' | 'wave' | 'cook' | 'happy' | 'sad' | 'sleep';

export const NOI_NOI_FLAT: Record<NoiNoiFlatPose, string> = {
  pot: noiNoiPot,
  wave: noiNoiWave,
  cook: noiNoiCook,
  happy: noiNoiHappy,
  sad: noiNoiSad,
  sleep: noiNoiSleep,
};

const iconModules = import.meta.glob<string>('../../assets/theme-d/game/icons/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

export const GAME_ICONS: Record<string, string> = Object.fromEntries(
  Object.entries(iconModules).map(([path, url]) => {
    const base = path.split('/').pop() ?? path;
    return [base.replace(/\.webp$/, ''), url];
  }),
);

/** Painted icon URL by id (e.g. 'map', 'quest'), or undefined → caller falls back to emoji. */
export function gameIcon(id: string): string | undefined {
  return GAME_ICONS[id];
}

import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { shiftPhaseAt } from '@/features/stall/lib/rush';
import { useStall } from '@/features/stall/store';
import { applyMusicScene, armMusic, resolveMusicScene, type MusicArea } from '@/lib/music';

/**
 * Music director (Gói H8): mounted once at the router root, it maps
 * "where the player is" onto the music engine's scene — calm for the
 * learning loop, the stall theme at the stall/market, the faster rush
 * track mid-shift, the festival track on a Night Festival shift, and
 * the calm theme ducked under every cooking run. Non-player areas
 * (admin / editor / support / public pages) stay silent.
 */
function areaForPath(pathname: string): MusicArea {
  if (pathname.startsWith('/cooking/')) return 'cooking';
  if (pathname === '/stall') return 'stall';
  if (pathname === '/market') return 'market';
  if (
    pathname === '/home' ||
    pathname.startsWith('/recipes') ||
    pathname === '/map' ||
    pathname === '/album' ||
    pathname === '/skills' ||
    pathname === '/quests' ||
    pathname === '/survival' ||
    pathname === '/mystery' ||
    pathname.startsWith('/inbox') ||
    pathname === '/achievements' ||
    pathname === '/collection' ||
    pathname === '/leaderboard' ||
    pathname.startsWith('/profile')
  ) {
    return 'player';
  }
  return 'other';
}

export function MusicDirector() {
  const location = useLocation();
  const { user } = useAuth();
  const isPlayer = user?.role === 'player';
  const area = areaForPath(location.pathname);
  const stall = useStall(isPlayer && area === 'stall' ? (user?.id ?? null) : null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    armMusic();
  }, []);

  // Rush hour is a function of time inside the shift — re-check it on
  // the same one-second heartbeat the stall page itself uses.
  useEffect(() => {
    if (area !== 'stall') return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [area]);

  const scene = useMemo(() => {
    const festival = area === 'stall' && Boolean(stall?.shift?.festival);
    const rush =
      area === 'stall' && Boolean(stall?.shift) && shiftPhaseAt(stall!.shift!, now) === 'rush';
    return resolveMusicScene({ area, isPlayer, festival, rush });
  }, [area, isPlayer, stall?.shift, now]);

  useEffect(() => {
    applyMusicScene(scene);
  }, [scene]);

  return null;
}

/** Router root layout: the director plus the matched route. */
export function MusicLayout() {
  return (
    <>
      <MusicDirector />
      <Outlet />
    </>
  );
}

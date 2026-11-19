import type { ReactNode } from 'react';

import { GameShell } from '@/pages/player/GameShell';

interface PlayerShellProps {
  children: ReactNode;
}

/**
 * PlayerShell (Gói Game-Shell): the old sidebar/navbar shell is gone —
 * every player page now renders inside the shared game shell (festival
 * scene, HUD plaques, wooden bottom nav, pause menu). This wrapper
 * keeps the historical import surface so all player pages pick up the
 * game frame without individual edits; pages sit on a fitted parchment
 * board.
 */
export function PlayerShell({ children }: PlayerShellProps) {
  return <GameShell variant="board">{children}</GameShell>;
}

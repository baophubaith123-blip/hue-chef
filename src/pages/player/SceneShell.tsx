import type { ReactNode } from 'react';

import { GameShell } from '@/pages/player/GameShell';

interface SceneShellProps {
  /** Kept for call-site compatibility; the game shell derives the
   *  active tab from the route itself. */
  active?: 'home' | 'recipes';
  children: ReactNode;
}

/**
 * SceneShell (Gói Game-Shell): scene pages (home, recipes) paint their
 * own boards on the festival scene, so the game shell renders their
 * children raw — no extra parchment board around them.
 */
export function SceneShell({ children }: SceneShellProps) {
  return <GameShell variant="scene">{children}</GameShell>;
}

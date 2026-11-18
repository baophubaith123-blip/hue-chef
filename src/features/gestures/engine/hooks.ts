import { useEffect, useRef } from 'react';

/** Run `cb` on every animation frame while `active` (KH1 mục 3.4: the
 * engine samples pointer input per frame; feedback must stay < 100ms). */
export function useRafLoop(cb: (now: number) => void, active = true): void {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    if (!active) return undefined;
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      cbRef.current(now);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

/**
 * Hard time cap for one action (KH1 mục 3.6: no action may ever trap the
 * player — when time runs out the module banks the partial work done).
 */
export function useDeadline(ms: number, cb: () => void): void {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    const timer = window.setTimeout(() => cbRef.current(), ms);
    return () => window.clearTimeout(timer);
  }, [ms]);
}

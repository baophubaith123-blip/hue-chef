import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';

import { router } from '@/app/router';

/**
 * Phase 17 — fading scrollbars: mark the element that is currently
 * scrolling so its slim scrollbar thumb can fade in, then fade it
 * back out shortly after scrolling stops.
 */
function useFadingScrollbars() {
  useEffect(() => {
    const timers = new WeakMap<Element, number>();
    const onScroll = (event: Event) => {
      const el = event.target;
      if (!(el instanceof Element)) return;
      el.classList.add('is-scrolling');
      const prev = timers.get(el);
      if (prev) window.clearTimeout(prev);
      timers.set(
        el,
        window.setTimeout(() => el.classList.remove('is-scrolling'), 700),
      );
    };
    document.addEventListener('scroll', onScroll, true);
    return () => document.removeEventListener('scroll', onScroll, true);
  }, []);
}

export function App() {
  useFadingScrollbars();
  return <RouterProvider router={router} />;
}

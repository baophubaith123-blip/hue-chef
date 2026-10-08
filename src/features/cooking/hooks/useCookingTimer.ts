import { useEffect } from 'react';

export function useCookingTimer(isRunning: boolean, onTick: () => void): void {
  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }
    const timerId = window.setInterval(onTick, 1000);
    return () => {
      window.clearInterval(timerId);
    };
  }, [isRunning, onTick]);
}

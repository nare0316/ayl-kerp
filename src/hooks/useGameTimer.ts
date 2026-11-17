import { useEffect, useRef, useState } from 'react';
import { getRemainingMs, isTurnExpired } from '../game/gameLogic';
import type { GameState } from '../types/game';

/**
 * Drives the countdown from the absolute deadline (turnEndTimestamp), so the
 * value stays correct after the tab was suspended, the screen was locked or
 * the app was reopened. The interval only triggers re-renders; it never
 * decrements anything. onExpire fires once per running turn.
 */
export function useGameTimer(state: GameState, onExpire: () => void): number {
  const [now, setNow] = useState(() => Date.now());
  const stateRef = useRef(state);
  stateRef.current = state;
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const running = state.status === 'playing' && !state.isPaused;

  useEffect(() => {
    if (!running) return;
    let fired = false;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (!fired && isTurnExpired(stateRef.current, t)) {
        fired = true;
        onExpireRef.current();
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', tick);
    window.addEventListener('pageshow', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', tick);
      window.removeEventListener('pageshow', tick);
    };
  }, [running, state.turnEndTimestamp]);

  return getRemainingMs(state, running ? now : Date.now());
}

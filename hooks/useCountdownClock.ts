import { useCallback, useEffect, useRef, useState } from 'react';

/** How often the readout refreshes. It shows whole seconds, so once a second is enough. */
const TICK_MS = 1000;

type Options = {
  /** Ticks while true, holds while false. Pausing the sound pauses the clock with it. */
  running: boolean;
  /** How long it runs for, or null to count up with no end — the session's ∞ pill. */
  timerMinutes: number | null;
  /** Called once when the time runs out. Not called at all when there is no limit. */
  onExpire: () => void;
};

type CountdownClock = {
  /** How long it has run for, paused time excluded. */
  elapsedSeconds: number;
  /** Counts down to zero, or null when there is no timer to count. */
  remainingSeconds: number | null;
  /**
   * Puts the clock back to zero and re-arms the timer. For starting another stretch after
   * one has run out — without it, a resumed session would sit at zero remaining forever.
   * Only safe while stopped; while running it would leave the current segment behind.
   */
  restart: () => void;
};

/**
 * A clock that can be paused: elapsed up, remaining down, and one call when it runs out.
 * The session runs on it, and so does the guided breathing.
 *
 * Elapsed time is measured against the wall clock rather than counted in ticks. A sound
 * keeps playing while the app is backgrounded but timers there are throttled or stopped
 * outright, so a tick-counted clock would drift behind the audio it is meant to describe.
 */
export function useCountdownClock({ running, timerMinutes, onExpire }: Options): CountdownClock {
  const [elapsedMs, setElapsedMs] = useState(0);
  /** Time banked by the segments that have already played, so a pause does not reset it. */
  const bankedRef = useRef(0);
  const onExpireRef = useRef(onExpire);
  const expiredRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Re-arm on a change of timer, so extending a session that has just ended runs on and
  // expires again at the new length rather than staying silently expired.
  useEffect(() => {
    expiredRef.current = false;
  }, [timerMinutes]);

  useEffect(() => {
    if (!running) return;

    const startedAt = Date.now();
    const tick = () => setElapsedMs(bankedRef.current + (Date.now() - startedAt));
    const interval = setInterval(tick, TICK_MS);

    return () => {
      clearInterval(interval);
      // Bank the segment on the way out and publish it, so a pause lands on the second it
      // actually happened rather than on the last tick, up to a second earlier.
      bankedRef.current += Date.now() - startedAt;
      setElapsedMs(bankedRef.current);
    };
  }, [running]);

  const timerMs = timerMinutes === null ? null : timerMinutes * 60 * 1000;
  const remainingMs = timerMs === null ? null : Math.max(0, timerMs - elapsedMs);

  useEffect(() => {
    if (remainingMs !== 0 || expiredRef.current) return;
    expiredRef.current = true;
    onExpireRef.current();
  }, [remainingMs]);

  const restart = useCallback(() => {
    bankedRef.current = 0;
    expiredRef.current = false;
    setElapsedMs(0);
  }, []);

  return {
    restart,
    elapsedSeconds: Math.floor(elapsedMs / 1000),
    // Rounded up, so a 45 minute timer reads "45:00" on the first tick and only reaches
    // zero when it is genuinely over.
    remainingSeconds: remainingMs === null ? null : Math.ceil(remainingMs / 1000),
  };
}

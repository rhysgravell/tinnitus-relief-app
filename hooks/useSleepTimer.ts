import { useCallback, useEffect, useRef, useState } from 'react';

export const TIMER_PRESETS = [15, 30, 45, 60] as const;
export type TimerPreset = (typeof TIMER_PRESETS)[number];

export function useSleepTimer(onExpire: () => void) {
  const [minutesRemaining, setMinutesRemaining] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const cancel = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setMinutesRemaining(null);
  }, []);

  const start = useCallback(
    (minutes: TimerPreset) => {
      cancel();
      setMinutesRemaining(minutes);
      let remaining = minutes * 60;
      intervalRef.current = setInterval(() => {
        remaining -= 1;
        setMinutesRemaining(Math.ceil(remaining / 60));
        if (remaining <= 0) {
          cancel();
          onExpireRef.current();
        }
      }, 1000);
    },
    [cancel]
  );

  useEffect(() => () => cancel(), [cancel]);

  return { minutesRemaining, start, cancel };
}

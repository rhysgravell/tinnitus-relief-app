import { useCallback, useEffect, useState } from 'react';
import { cancelWindDown, scheduleWindDown } from '../store/reminders';
import { getSettings, updateSettings, windDownAt } from '../store/settings';
import type { TimeOfDay } from '../utils/time';

type WindDown = {
  /** Whether a reminder is actually scheduled — not merely what the user asked for. */
  enabled: boolean;
  at: TimeOfDay | null;
  /** False until the stored setting has been read; the switch renders off until then. */
  ready: boolean;
  /**
   * True when the switch is off because the OS refused notifications, rather than because
   * the user turned it off. The screen says so — a switch that silently sprang back would
   * look broken.
   */
  denied: boolean;
  setEnabled: (on: boolean) => void;
};

/**
 * The nightly wind-down reminder: the stored setting, and the OS-level schedule that has
 * to agree with it.
 *
 * The two can disagree in one direction only — permission refused — and this hook resolves
 * that by trusting the OS and putting the setting back, so what is stored is always what
 * will actually happen.
 */
export function useWindDown(): WindDown {
  const [enabled, setEnabled] = useState(false);
  const [at, setAt] = useState<TimeOfDay | null>(null);
  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let active = true;
    getSettings().then((settings) => {
      if (!active) return;
      setEnabled(settings.windDownEnabled);
      setAt(windDownAt(settings));
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const change = useCallback(
    (on: boolean) => {
      if (!at) return;
      // Moved first so the switch answers the tap. The only thing that can take it back is
      // the OS refusing, which is handled below.
      setEnabled(on);
      setDenied(false);

      void (async () => {
        if (!on) {
          await cancelWindDown();
          await updateSettings({ windDownEnabled: false });
          return;
        }

        const outcome = await scheduleWindDown(at);
        if (outcome === 'denied') {
          setEnabled(false);
          setDenied(true);
          // Stored as off, because off is what it is. Nothing will arrive.
          await updateSettings({ windDownEnabled: false });
          return;
        }
        await updateSettings({ windDownEnabled: true });
      })();
    },
    [at]
  );

  return { enabled, at, ready, denied, setEnabled: change };
}

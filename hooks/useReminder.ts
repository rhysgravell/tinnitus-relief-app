import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { cancelReminder, reminderState, scheduleReminder } from '../store/reminders';
import { getSettings, reminderPatch, reminderSetting, updateSettings } from '../store/settings';
import type { ReminderKind } from '../store/reminders';
import type { ReminderSetting } from '../store/settings';
import type { TimeOfDay } from '../utils/time';

export type Reminder = {
  /** Whether a reminder is actually scheduled — not merely what the user asked for. */
  enabled: boolean;
  at: TimeOfDay | null;
  /** False until the stored setting has been read; the switch renders off until then. */
  ready: boolean;
  /**
   * True when the reminder is off because the OS refused notifications, rather than because
   * the user turned it off. The screen says so — a switch that silently sprang back would
   * look broken.
   */
  denied: boolean;
  setEnabled: (on: boolean) => void;
  /**
   * Sets the time, which turns the reminder on: picking a time is how a user asks for one.
   * Null turns it off and keeps the time, so switching it back on remembers the choice.
   */
  chooseTime: (at: TimeOfDay | null) => void;
};

/**
 * One of the daily reminders: the stored setting, and the OS-level schedule that has to
 * agree with it.
 *
 * The two can disagree in one direction only — the OS will not deliver what was stored —
 * and this hook resolves that by trusting the OS and putting the setting back, so what is
 * stored is always what will actually happen.
 */
export function useReminder(kind: ReminderKind): Reminder {
  const [enabled, setEnabled] = useState(false);
  const [at, setAt] = useState<TimeOfDay | null>(null);
  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState(false);

  /**
   * Brings the switch into line with what the OS is actually going to do.
   *
   * A reminder is stored as on when it is scheduled and then never asked about again. But
   * notifications can be switched off for the app afterwards, in the phone's settings,
   * where nothing tells this app it happened — and a schedule does not always survive a
   * restore onto a new phone. Either way the row would sit there promising a nudge that is
   * never coming, which is worse than a switch that is honestly off.
   */
  const reconcile = useCallback(
    async (target: ReminderSetting) => {
      // Nothing to check: an off reminder is not going to arrive, which is what it says.
      if (!target.enabled) return;

      const state = await reminderState(kind);
      if (state === 'scheduled') return;

      if (state === 'missing') {
        // Permission is intact, so this is a schedule that went astray rather than a
        // decision anyone made. Put it back rather than report the reminder off.
        const outcome = await scheduleReminder(kind, target.at);
        if (outcome === 'scheduled') return;
      }

      setEnabled(false);
      setDenied(true);
      // Stored as off, because off is what it is.
      await updateSettings(reminderPatch(kind, { ...target, enabled: false }));
    },
    [kind]
  );

  useEffect(() => {
    let active = true;
    getSettings().then((settings) => {
      if (!active) return;
      const stored = reminderSetting(settings, kind);
      setEnabled(stored.enabled);
      setAt(stored.at);
      setReady(true);
      void reconcile(stored);
    });
    return () => {
      active = false;
    };
  }, [kind, reconcile]);

  useEffect(() => {
    // Turning notifications off means leaving this app for the phone's settings and coming
    // back, so the way back in is the moment to ask again. Sleep is a tab and stays mounted
    // for the life of the app, so a check on mount alone would be a check once a launch.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || at === null) return;
      void reconcile({ enabled, at });
    });
    return () => subscription.remove();
  }, [at, enabled, reconcile]);

  const apply = useCallback(
    (on: boolean, time: TimeOfDay | null) => {
      // Nothing to schedule against yet: the stored time has not been read.
      if (!time) return;
      const target = { enabled: on, at: time };

      // Moved first so the control answers the tap. The only thing that can take it back is
      // the OS refusing, which is handled below.
      setEnabled(on);
      setAt(time);
      setDenied(false);

      void (async () => {
        if (!on) {
          await cancelReminder(kind);
          await updateSettings(reminderPatch(kind, target));
          return;
        }

        const outcome = await scheduleReminder(kind, time);
        if (outcome === 'denied') {
          setEnabled(false);
          setDenied(true);
          // Stored as off, because off is what it is. Nothing will arrive.
          await updateSettings(reminderPatch(kind, { ...target, enabled: false }));
          return;
        }
        await updateSettings(reminderPatch(kind, target));
      })();
    },
    [kind]
  );

  const change = useCallback((on: boolean) => apply(on, at), [apply, at]);

  const chooseTime = useCallback(
    (next: TimeOfDay | null) => apply(next !== null, next ?? at),
    [apply, at]
  );

  return { enabled, at, ready, denied, setEnabled: change, chooseTime };
}

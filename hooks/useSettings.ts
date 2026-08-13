import { useCallback, useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../store/settings';
import type { Settings } from '../store/settings';

type UseSettings = {
  /** Null until storage has been read. Rows wait rather than render the wrong state. */
  settings: Settings | null;
  update: (patch: Partial<Settings>) => void;
};

/**
 * The stored settings, with each change applied on screen before it is written.
 *
 * A switch that waited on AsyncStorage would lag the thumb, and nothing here can fail in a
 * way the user needs to hear about — the reminders, which can, live in `useReminder`.
 */
export function useSettings(): UseSettings {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    let active = true;
    getSettings().then((stored) => {
      if (active) setSettings(stored);
    });
    return () => {
      active = false;
    };
  }, []);

  /** To be called once `settings` has arrived — which is when a row exists to call it. */
  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => (current ? { ...current, ...patch } : current));
    // The write reads storage back first, so a patch cannot clobber a setting this screen
    // is not showing.
    void updateSettings(patch);
  }, []);

  return { settings, update };
}

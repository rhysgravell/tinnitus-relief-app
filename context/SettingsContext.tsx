import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getSettings, updateSettings } from '../store/settings';
import type { Settings } from '../store/settings';

type SettingsContextValue = {
  /** Null until storage has been read. Rows wait rather than render the wrong state. */
  settings: Settings | null;
  update: (patch: Partial<Settings>) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * The stored settings, with each change applied on screen before it is written.
 *
 * A switch that waited on AsyncStorage would lag the thumb, and nothing here can fail in a
 * way the user needs to hear about — the reminders, which can, live in `useReminder`.
 *
 * Shared through a provider rather than read per screen because one of these settings is
 * the app's palette: "Dark after sunset" has to repaint the screen it was switched on.
 * Provided at the root, so it reaches the session modal as well as the tabs.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
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
    // Not awaited, and it does not need to be: the store queues its writes, so a patch sent
    // while another is still landing reads what that one left rather than clobbering it.
    void updateSettings(patch);
  }, []);

  const value = useMemo<SettingsContextValue>(() => ({ settings, update }), [settings, update]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

/**
 * Throws outside a provider rather than falling back to the defaults: a screen showing
 * settings nobody had stored would look like it worked and quietly lose every change.
 */
export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) {
    throw new Error('useSettings must be used inside a SettingsProvider');
  }
  return value;
}

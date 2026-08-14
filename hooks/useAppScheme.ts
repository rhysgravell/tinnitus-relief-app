import { useEffect, useReducer } from 'react';
import { AppState } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { DEFAULT_SETTINGS } from '../store/settings';
import { isDarkHour, msUntilNextDarkChange } from '../utils/darkHours';
import type { Scheme } from '../theme/tokens';

/**
 * The palette the app is wearing: dark through the evening and the night if "Dark after
 * sunset" is on, light otherwise.
 *
 * This is the app-wide scheme only. Session and Sleep are night surfaces whatever the
 * hour, and provide their own dark palette over this one.
 */
export function useAppScheme(): Scheme {
  const { settings } = useSettings();
  // The stored value arrives a tick after launch. Until it does, assume the default —
  // which is on — because opening light and turning dark a moment later is a flash of
  // white at exactly the hour this setting exists to avoid.
  const enabled = settings?.darkAfterSunset ?? DEFAULT_SETTINGS.darkAfterSunset;

  const [generation, recheck] = useReducer((count: number) => count + 1, 0);

  useEffect(() => {
    if (!enabled) return;

    // One timer, set for the boundary itself, rather than a clock ticking all evening.
    const timer = setTimeout(recheck, msUntilNextDarkChange(new Date()));
    // Timers do not fire reliably while the app is in the background, and a phone picked
    // up at 2am was very likely put down before dark.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') recheck();
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
    // `generation` re-arms the timer for the next boundary once this one has passed.
  }, [enabled, generation]);

  return enabled && isDarkHour(new Date()) ? 'dark' : 'light';
}

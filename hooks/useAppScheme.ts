import { useColorScheme } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { DEFAULT_SETTINGS } from '../store/settings';
import type { Scheme } from '../theme/tokens';

/**
 * The palette the app is wearing: the night one whenever the phone itself has gone dark
 * and "Dark after sunset" is on, the day one otherwise.
 *
 * The phone is the clock here. Both iOS and Android can switch themselves at sunset, and
 * they know when that is because they know where they are — which this app does not, and
 * would have to ask for a location permission to find out, on behalf of a colour. A phone
 * left on light all day never dims this app either, which is the trade: the setting says
 * dark when you want dark, and the phone is where that is already decided.
 *
 * This is the app-wide scheme only. Session and Sleep are night surfaces at any hour and
 * provide their own dark palette over this one.
 */
export function useAppScheme(): Scheme {
  const { settings } = useSettings();
  // The stored value arrives a tick after launch. Until it does, assume the default —
  // which is on — because opening light and turning dark a moment later is a flash of
  // white at exactly the hour this setting exists to avoid.
  const enabled = settings?.darkAfterSunset ?? DEFAULT_SETTINGS.darkAfterSunset;
  const phone = useColorScheme();

  return enabled && phone === 'dark' ? 'dark' : 'light';
}

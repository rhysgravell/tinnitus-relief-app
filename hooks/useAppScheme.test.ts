import { renderHook } from '@testing-library/react-native';
import { useColorScheme } from 'react-native';
import type { ColorSchemeName } from 'react-native';
import { useAppScheme } from './useAppScheme';
import * as settingsContext from '../context/SettingsContext';
import { DEFAULT_SETTINGS } from '../store/settings';

jest.mock('react-native/Libraries/Utilities/useColorScheme');

const mockUseColorScheme = jest.mocked(useColorScheme);

/** What `useSettings` is holding: the stored settings, or null before the read lands. */
function storedSettings(darkAfterSunset: boolean | null) {
  jest.spyOn(settingsContext, 'useSettings').mockReturnValue({
    settings: darkAfterSunset === null ? null : { ...DEFAULT_SETTINGS, darkAfterSunset },
    update: jest.fn(),
  });
}

/** What the phone says its own appearance is. */
function phoneIs(scheme: ColorSchemeName) {
  mockUseColorScheme.mockReturnValue(scheme);
}

beforeEach(() => {
  jest.restoreAllMocks();
  storedSettings(true);
  phoneIs('light');
});

describe('useAppScheme', () => {
  it('is light while the phone is', () => {
    const { result } = renderHook(() => useAppScheme());
    expect(result.current).toBe('light');
  });

  it('goes dark with the phone', () => {
    phoneIs('dark');
    const { result } = renderHook(() => useAppScheme());
    expect(result.current).toBe('dark');
  });

  it('follows the phone as it changes under the app', () => {
    // Both platforms can switch themselves at sunset, and that is the moment this is for.
    const { result, rerender } = renderHook(() => useAppScheme());
    expect(result.current).toBe('light');

    phoneIs('dark');
    rerender(undefined);
    expect(result.current).toBe('dark');
  });

  it('stays light with the setting off, whatever the phone is doing', () => {
    storedSettings(false);
    phoneIs('dark');
    const { result } = renderHook(() => useAppScheme());
    expect(result.current).toBe('light');
  });

  it('assumes the setting is on until storage answers', () => {
    // It is on by default, and a white screen for the first frame of an evening launch is
    // the one thing this setting exists to prevent.
    storedSettings(null);
    phoneIs('dark');
    const { result } = renderHook(() => useAppScheme());
    expect(result.current).toBe('dark');
  });

  it('stays light where the platform will not say', () => {
    // Anything that is not dark is treated as light, which covers the platforms that
    // answer this with nothing at all.
    phoneIs('unspecified');
    const { result } = renderHook(() => useAppScheme());
    expect(result.current).toBe('light');
  });
});

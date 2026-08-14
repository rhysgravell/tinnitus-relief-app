import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { useAppScheme } from './useAppScheme';
import * as settingsContext from '../context/SettingsContext';
import { DEFAULT_SETTINGS } from '../store/settings';

/** What `useSettings` is holding: the stored settings, or null before the read lands. */
function storedSettings(darkAfterSunset: boolean | null) {
  jest.spyOn(settingsContext, 'useSettings').mockReturnValue({
    settings: darkAfterSunset === null ? null : { ...DEFAULT_SETTINGS, darkAfterSunset },
    update: jest.fn(),
  });
}

/** Moves the whole test to a time of day, before anything reads the clock. */
function clockAt(hour: number, minute = 0) {
  jest.setSystemTime(new Date(2026, 7, 14, hour, minute));
}

/** The handler the hook registers for the app coming back to the foreground. */
let foreground: ((state: AppStateStatus) => void) | null = null;
const removeListener = jest.fn();

beforeEach(() => {
  jest.restoreAllMocks();
  jest.useFakeTimers();
  foreground = null;
  removeListener.mockClear();
  // Cleared as well as re-implemented: a spy on a method already spied on is the same spy,
  // carrying the calls the last test made to it.
  jest
    .spyOn(AppState, 'addEventListener')
    .mockClear()
    .mockImplementation((_type, handler) => {
      foreground = handler as (state: AppStateStatus) => void;
      return { remove: removeListener } as ReturnType<typeof AppState.addEventListener>;
    });
  storedSettings(true);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useAppScheme', () => {
  it('is light through the day', () => {
    clockAt(14);
    const { result } = renderHook(() => useAppScheme());
    expect(result.current).toBe('light');
  });

  it('is dark in the evening', () => {
    clockAt(21, 30);
    const { result } = renderHook(() => useAppScheme());
    expect(result.current).toBe('dark');
  });

  it('is dark in the small hours', () => {
    clockAt(3);
    const { result } = renderHook(() => useAppScheme());
    expect(result.current).toBe('dark');
  });

  it('stays light all night when the setting is off', () => {
    storedSettings(false);
    clockAt(23);
    const { result } = renderHook(() => useAppScheme());
    expect(result.current).toBe('light');
  });

  it('assumes the setting is on until storage answers', () => {
    // It is on by default, and a white screen for the first frame of an evening launch is
    // the one thing this setting exists to prevent.
    storedSettings(null);
    clockAt(23);
    const { result } = renderHook(() => useAppScheme());
    expect(result.current).toBe('dark');
  });

  it('dims itself on the hour, with the app open', () => {
    clockAt(18, 59);
    const { result } = renderHook(() => useAppScheme());
    expect(result.current).toBe('light');

    act(() => {
      jest.advanceTimersByTime(60 * 1000);
    });
    expect(result.current).toBe('dark');
  });

  it('lightens again in the morning', () => {
    clockAt(5, 59);
    const { result } = renderHook(() => useAppScheme());
    expect(result.current).toBe('dark');

    act(() => {
      jest.advanceTimersByTime(60 * 1000);
    });
    expect(result.current).toBe('light');
  });

  it('leaves the palette alone between the boundaries', () => {
    clockAt(20);
    const { result } = renderHook(() => useAppScheme());

    act(() => {
      jest.advanceTimersByTime(3 * 60 * 60 * 1000);
    });
    expect(result.current).toBe('dark');
  });

  it('checks the hour again when the app is picked up', () => {
    // A phone put down before dinner and picked up at midnight ran no timers in between.
    clockAt(17);
    const { result } = renderHook(() => useAppScheme());
    expect(result.current).toBe('light');

    clockAt(23, 45);
    act(() => foreground?.('active'));
    expect(result.current).toBe('dark');
  });

  it('ignores the app going away', () => {
    clockAt(17);
    const { result } = renderHook(() => useAppScheme());

    clockAt(23, 45);
    act(() => foreground?.('background'));
    expect(result.current).toBe('light');
  });

  it('watches nothing while the setting is off', () => {
    storedSettings(false);
    clockAt(14);
    renderHook(() => useAppScheme());

    expect(AppState.addEventListener).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('stops watching once the app is gone', () => {
    clockAt(14);
    const { unmount } = renderHook(() => useAppScheme());
    unmount();

    expect(removeListener).toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });
});

import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { useGreeting } from './useGreeting';

/** Local time, since the greeting reads the local clock. */
function at(iso: string) {
  return new Date(iso);
}

/** The app-state listeners the hook has registered, in place of the real subscription. */
let listeners: ((state: AppStateStatus) => void)[] = [];

function foreground() {
  act(() => listeners.forEach((listener) => listener('active')));
}

/**
 * Moves the clock on and lets any timer due in that stretch fire. Fake timers carry the
 * clock with them, so this must not also set the system time — that would count it twice.
 */
function advance(ms: number) {
  act(() => jest.advanceTimersByTime(ms));
}

beforeEach(() => {
  jest.useFakeTimers();

  listeners = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
    const listener = handler as (state: AppStateStatus) => void;
    listeners.push(listener);
    return {
      remove: () => {
        listeners = listeners.filter((entry) => entry !== listener);
      },
    } as unknown as ReturnType<typeof AppState.addEventListener>;
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

describe('useGreeting', () => {
  it('opens on the greeting for the hour it is', () => {
    jest.setSystemTime(at('2026-08-09T20:00:00'));
    const { result } = renderHook(() => useGreeting());

    expect(result.current).toBe('Good evening');
  });

  it('moves on with the hour, without the screen being remounted', () => {
    // Sounds is a tab. It mounts once and is never taken down again.
    jest.setSystemTime(at('2026-08-09T17:50:00'));
    const { result } = renderHook(() => useGreeting());
    expect(result.current).toBe('Good afternoon');

    advance(10 * MINUTE);
    expect(result.current).toBe('Good evening');
  });

  it('keeps moving on, rather than stopping after the first change', () => {
    jest.setSystemTime(at('2026-08-09T11:59:00'));
    const { result } = renderHook(() => useGreeting());

    advance(MINUTE);
    expect(result.current).toBe('Good afternoon');

    advance(6 * HOUR);
    expect(result.current).toBe('Good evening');

    advance(6 * HOUR);
    expect(result.current).toBe('Good morning');
  });

  it('catches up when the app is picked up again', () => {
    // The case that actually matters: opened in the afternoon, put down, and reached for at
    // half ten to wind down. Timers are not to be relied on while the app is away.
    jest.setSystemTime(at('2026-08-09T15:00:00'));
    const { result } = renderHook(() => useGreeting());
    expect(result.current).toBe('Good afternoon');

    act(() => {
      jest.setSystemTime(at('2026-08-09T22:30:00'));
    });
    foreground();

    expect(result.current).toBe('Good evening');
  });

  it('leaves no timer or listener behind when the screen goes', () => {
    jest.setSystemTime(at('2026-08-09T11:00:00'));
    const { unmount } = renderHook(() => useGreeting());

    unmount();

    expect(jest.getTimerCount()).toBe(0);
    expect(listeners).toHaveLength(0);
  });
});

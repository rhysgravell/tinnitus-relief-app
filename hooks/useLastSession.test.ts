import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useFocusEffect } from 'expo-router';
import { useLastSession } from './useLastSession';
import * as sessions from '../store/sessions';
import type { Session } from '../store/sessions';

/**
 * The real `useFocusEffect` needs a navigator. This stand-in runs the callback once, the
 * way a first focus would, and keeps hold of it so a test can refocus the screen.
 */
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));

const mockUseFocusEffect = jest.mocked(useFocusEffect);

type Cleanup = void | (() => void);
let refocus: () => Cleanup = () => {};

const session: Session = {
  soundId: 'underwater',
  endedAt: '2026-08-08T22:30:00',
  durationMinutes: 42,
  timerMinutes: 45,
};

beforeEach(() => {
  jest.restoreAllMocks();
  mockUseFocusEffect.mockImplementation((effect) => {
    refocus = effect as () => Cleanup;
  });
});

describe('useLastSession', () => {
  it('starts unloaded with nothing to resume', () => {
    jest.spyOn(sessions, 'getLastSession').mockResolvedValue(null);
    const { result } = renderHook(() => useLastSession());
    expect(result.current).toEqual({ session: null, loaded: false });
  });

  it('reports a first-run user as loaded with no session', async () => {
    jest.spyOn(sessions, 'getLastSession').mockResolvedValue(null);
    const { result } = renderHook(() => useLastSession());

    await act(async () => {
      refocus();
    });

    expect(result.current).toEqual({ session: null, loaded: true });
  });

  it('returns the stored session', async () => {
    jest.spyOn(sessions, 'getLastSession').mockResolvedValue(session);
    const { result } = renderHook(() => useLastSession());

    await act(async () => {
      refocus();
    });

    expect(result.current.session).toEqual(session);
  });

  it('re-reads on every focus, since the session is recorded on a screen above this one', async () => {
    const read = jest.spyOn(sessions, 'getLastSession').mockResolvedValue(null);
    renderHook(() => useLastSession());

    await act(async () => {
      refocus();
    });
    await act(async () => {
      refocus();
    });

    expect(read).toHaveBeenCalledTimes(2);
  });

  it('picks up a session recorded while it was away', async () => {
    const read = jest.spyOn(sessions, 'getLastSession').mockResolvedValue(null);
    const { result } = renderHook(() => useLastSession());

    await act(async () => {
      refocus();
    });
    expect(result.current.session).toBeNull();

    read.mockResolvedValue(session);
    await act(async () => {
      refocus();
    });

    await waitFor(() => expect(result.current.session).toEqual(session));
  });

  it('ignores a read that lands after the screen loses focus', async () => {
    // Otherwise a slow read would set state on an unfocused screen.
    let settle: (value: Session | null) => void = () => {};
    jest
      .spyOn(sessions, 'getLastSession')
      .mockReturnValue(new Promise((resolve) => (settle = resolve)));

    const { result } = renderHook(() => useLastSession());

    let cleanup: Cleanup = undefined;
    await act(async () => {
      cleanup = refocus();
    });
    act(() => {
      cleanup?.();
    });
    await act(async () => {
      settle(session);
    });

    expect(result.current.session).toBeNull();
  });
});

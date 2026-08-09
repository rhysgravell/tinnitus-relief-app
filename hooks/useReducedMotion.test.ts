import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

afterEach(() => {
  jest.restoreAllMocks();
});

type ReduceMotionListener = (enabled: boolean) => void;

/**
 * `addEventListener` is typed per event name, so a stub for one event does not satisfy
 * the whole overloaded signature. The cast keeps that noise out of the tests themselves.
 */
function stubListener(onSubscribe: (handler: ReduceMotionListener) => void, remove = () => {}) {
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(((
    _event: string,
    handler: ReduceMotionListener
  ) => {
    onSubscribe(handler);
    return { remove };
  }) as unknown as typeof AccessibilityInfo.addEventListener);
}

describe('useReducedMotion', () => {
  it('starts off and corrects itself once the platform answers', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('animates when the setting is off', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const { result } = renderHook(() => useReducedMotion());

    await waitFor(() => expect(AccessibilityInfo.isReduceMotionEnabled).toHaveBeenCalled());
    expect(result.current).toBe(false);
  });

  it('animates when the platform does not implement the lookup', async () => {
    // Failing closed would leave the rings frozen for everyone on that platform.
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockRejectedValue(new Error('unsupported'));
    const { result } = renderHook(() => useReducedMotion());

    await waitFor(() => expect(AccessibilityInfo.isReduceMotionEnabled).toHaveBeenCalled());
    expect(result.current).toBe(false);
  });

  it('follows the setting changing while the app is open', async () => {
    const listeners: ReduceMotionListener[] = [];
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    stubListener((handler) => listeners.push(handler));

    const { result } = renderHook(() => useReducedMotion());
    await waitFor(() => expect(listeners).toHaveLength(1));

    act(() => listeners[0](true));
    expect(result.current).toBe(true);
  });

  it('unsubscribes on unmount', async () => {
    const remove = jest.fn();
    stubListener(() => {}, remove);

    const { unmount } = renderHook(() => useReducedMotion());
    unmount();

    expect(remove).toHaveBeenCalled();
  });
});

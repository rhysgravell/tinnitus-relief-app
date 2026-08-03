import { act, renderHook } from '@testing-library/react-native';
import { useSleepTimer } from './useSleepTimer';

describe('useSleepTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts with no timer running', () => {
    const { result } = renderHook(() => useSleepTimer(jest.fn()));
    expect(result.current.minutesRemaining).toBeNull();
  });

  it('sets minutesRemaining to the chosen preset on start', () => {
    const { result } = renderHook(() => useSleepTimer(jest.fn()));
    act(() => {
      result.current.start(15);
    });
    expect(result.current.minutesRemaining).toBe(15);
  });

  it('counts down as time passes', () => {
    const { result } = renderHook(() => useSleepTimer(jest.fn()));
    act(() => {
      result.current.start(15);
    });
    act(() => {
      jest.advanceTimersByTime(14 * 60 * 1000);
    });
    expect(result.current.minutesRemaining).toBe(1);
  });

  it('calls onExpire and clears the timer once time runs out', () => {
    const onExpire = jest.fn();
    const { result } = renderHook(() => useSleepTimer(onExpire));
    act(() => {
      result.current.start(15);
    });
    act(() => {
      jest.advanceTimersByTime(15 * 60 * 1000);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(result.current.minutesRemaining).toBeNull();
  });

  it('cancel stops the countdown without calling onExpire', () => {
    const onExpire = jest.fn();
    const { result } = renderHook(() => useSleepTimer(onExpire));
    act(() => {
      result.current.start(15);
    });
    act(() => {
      result.current.cancel();
    });
    act(() => {
      jest.advanceTimersByTime(15 * 60 * 1000);
    });
    expect(result.current.minutesRemaining).toBeNull();
    expect(onExpire).not.toHaveBeenCalled();
  });
});

import { act, renderHook } from '@testing-library/react-native';
import { useSessionClock } from './useSessionClock';

type Options = Parameters<typeof useSessionClock>[0];

const MINUTE = 60 * 1000;

function setup(options: Partial<Options> = {}) {
  const onExpire = jest.fn();
  const initial: Options = { running: true, timerMinutes: 45, onExpire, ...options };
  const rendered = renderHook((props: Options) => useSessionClock(props), {
    initialProps: initial,
  });
  return { ...rendered, onExpire, initial };
}

/** Fake timers move `Date.now` too, which is what the hook measures elapsed time against. */
function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useSessionClock', () => {
  it('starts at zero with the full timer remaining', () => {
    const { result } = setup();
    expect(result.current.elapsedSeconds).toBe(0);
    expect(result.current.remainingSeconds).toBe(45 * 60);
  });

  it('counts elapsed up and remaining down together', () => {
    const { result } = setup();
    advance(90 * 1000);
    expect(result.current.elapsedSeconds).toBe(90);
    expect(result.current.remainingSeconds).toBe(45 * 60 - 90);
  });

  it('holds the clock while paused and picks up where it left off', () => {
    const { result, rerender, initial } = setup();
    advance(30 * 1000);

    rerender({ ...initial, running: false });
    advance(5 * MINUTE);
    expect(result.current.elapsedSeconds).toBe(30);

    rerender({ ...initial, running: true });
    advance(10 * 1000);
    expect(result.current.elapsedSeconds).toBe(40);
  });

  it('reports no remaining time on the infinite timer', () => {
    const { result } = setup({ timerMinutes: null });
    advance(2 * MINUTE);
    expect(result.current.remainingSeconds).toBeNull();
    expect(result.current.elapsedSeconds).toBe(120);
  });

  it('never expires on the infinite timer', () => {
    const { onExpire } = setup({ timerMinutes: null });
    advance(120 * MINUTE);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('expires once, when the timer runs out', () => {
    const { result, onExpire } = setup({ timerMinutes: 15 });
    advance(15 * MINUTE);

    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(result.current.remainingSeconds).toBe(0);
  });

  it('does not expire twice as the clock runs past the end', () => {
    const { onExpire } = setup({ timerMinutes: 15 });
    advance(20 * MINUTE);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('runs on when the timer is extended after expiring', () => {
    const { result, rerender, onExpire, initial } = setup({ timerMinutes: 15 });
    advance(15 * MINUTE);
    expect(onExpire).toHaveBeenCalledTimes(1);

    rerender({ ...initial, timerMinutes: 30 });
    advance(5 * MINUTE);
    expect(result.current.remainingSeconds).toBe(10 * 60);

    advance(10 * MINUTE);
    expect(onExpire).toHaveBeenCalledTimes(2);
  });

  it('expires immediately when the timer is shortened past the time already played', () => {
    const { result, rerender, onExpire, initial } = setup({ timerMinutes: 45 });
    advance(20 * MINUTE);
    expect(onExpire).not.toHaveBeenCalled();

    rerender({ ...initial, timerMinutes: 15 });
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(result.current.remainingSeconds).toBe(0);
  });

  it('rounds remaining time up so the full timer shows before the first second passes', () => {
    // A truncating clock would open a 45 minute session on "44:59".
    const { result } = setup({ timerMinutes: 45 });
    advance(500);
    expect(result.current.remainingSeconds).toBe(45 * 60);
  });

  it('puts the clock back to zero and re-arms on a restart', () => {
    const { result, rerender, onExpire, initial } = setup({ timerMinutes: 15 });
    advance(15 * MINUTE);
    expect(onExpire).toHaveBeenCalledTimes(1);

    // Stopped first, which is the only state a restart is meant for.
    rerender({ ...initial, timerMinutes: 15, running: false });
    act(() => result.current.restart());
    expect(result.current.elapsedSeconds).toBe(0);
    expect(result.current.remainingSeconds).toBe(15 * 60);

    rerender({ ...initial, timerMinutes: 15, running: true });
    advance(15 * MINUTE);
    expect(onExpire).toHaveBeenCalledTimes(2);
  });

  it('stops ticking once unmounted', () => {
    const { result, unmount } = setup();
    advance(10 * 1000);
    unmount();
    advance(10 * MINUTE);
    expect(result.current.elapsedSeconds).toBe(10);
  });

  it('picks up time the app spent in the background', () => {
    // Timers are throttled behind the lock screen but the sound keeps playing, so the
    // clock is read off the wall clock rather than counted a tick at a time.
    const { result } = setup();
    act(() => {
      jest.setSystemTime(Date.now() + 8 * MINUTE);
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.elapsedSeconds).toBe(8 * 60 + 1);
  });
});

import { act, renderHook } from '@testing-library/react-native';
import { BreathingPhase, useBreathingCycle } from './useBreathingCycle';

const PHASES: BreathingPhase[] = [
  { label: 'Breathe in', duration: 4 },
  { label: 'Hold', duration: 2 },
  { label: 'Breathe out', duration: 3 },
];

describe('useBreathingCycle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts on the first phase at its full duration', () => {
    const { result } = renderHook(() => useBreathingCycle(PHASES));
    expect(result.current.phase.label).toBe('Breathe in');
    expect(result.current.secondsRemaining).toBe(4);
  });

  it('counts down within a phase', () => {
    const { result } = renderHook(() => useBreathingCycle(PHASES));
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.phase.label).toBe('Breathe in');
    expect(result.current.secondsRemaining).toBe(2);
  });

  it('advances to the next phase once the duration elapses', () => {
    const { result } = renderHook(() => useBreathingCycle(PHASES));
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(result.current.phase.label).toBe('Hold');
    expect(result.current.secondsRemaining).toBe(2);
  });

  it('loops back to the first phase after the last one finishes', () => {
    const { result } = renderHook(() => useBreathingCycle(PHASES));
    act(() => {
      jest.advanceTimersByTime((4 + 2 + 3) * 1000);
    });
    expect(result.current.phase.label).toBe('Breathe in');
    expect(result.current.secondsRemaining).toBe(4);
  });

  it('stops ticking once unmounted', () => {
    const { result, unmount } = renderHook(() => useBreathingCycle(PHASES));
    unmount();
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(result.current.phase.label).toBe('Breathe in');
  });
});

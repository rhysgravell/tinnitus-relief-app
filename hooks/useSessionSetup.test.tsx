import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { useSessionSetup } from './useSessionSetup';
import { SoundStateProvider } from '../context/SoundStateContext';
import * as soundState from '../store/soundState';
import { DEFAULT_SETTINGS } from '../store/settings';
import { DEFAULT_SOUND_STATE } from '../store/soundState';
import type { Settings } from '../store/settings';

function wrapper({ children }: { children: ReactNode }) {
  return <SoundStateProvider>{children}</SoundStateProvider>;
}

/** The provider reads storage on mount; flushing it here is what makes the hook ready. */
async function setup(soundId: string | undefined, settings: Settings | null = DEFAULT_SETTINGS) {
  const rendered = renderHook(() => useSessionSetup(soundId, settings), { wrapper });
  await act(async () => {});
  return rendered;
}

function stored(patch: Partial<soundState.SoundState>) {
  jest
    .spyOn(soundState, 'getSoundStates')
    .mockResolvedValue({ underwater: { ...DEFAULT_SOUND_STATE, ...patch } });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(soundState, 'getSoundStates').mockResolvedValue({});
});

describe('useSessionSetup', () => {
  it('is not ready until the remembered values have been read', async () => {
    const { result } = renderHook(() => useSessionSetup('underwater', DEFAULT_SETTINGS), {
      wrapper,
    });
    expect(result.current.ready).toBe(false);

    await act(async () => {});
    expect(result.current.ready).toBe(true);
  });

  it('is not ready until the settings have been read either', async () => {
    // Both feed the opening timer, so starting on one of them would show the wrong pill.
    const { result } = await setup('underwater', null);
    expect(result.current.ready).toBe(false);
  });

  it('is never ready without a sound to play', async () => {
    const { result } = await setup(undefined);
    expect(result.current.ready).toBe(false);
  });

  it('shows the defaults rather than nothing while the reads are in flight', async () => {
    const { result } = renderHook(() => useSessionSetup('underwater', DEFAULT_SETTINGS), {
      wrapper,
    });
    expect(result.current.volume).toBe(DEFAULT_SOUND_STATE.lastVolume);
    expect(result.current.timerMinutes).toBe(DEFAULT_SOUND_STATE.lastTimerMinutes);
    await act(async () => {});
  });

  it('opens at the volume this sound last used', async () => {
    stored({ lastVolume: 0.31, sessionCount: 4 });
    const { result } = await setup('underwater');
    expect(result.current.volume).toBe(0.31);
  });

  it('opens on the timer this sound last used', async () => {
    stored({ lastTimerMinutes: 15, sessionCount: 4 });
    const { result } = await setup('underwater');
    expect(result.current.timerMinutes).toBe(15);
  });

  it('remembers an infinite timer as infinite rather than falling back to the default', async () => {
    // Null is a real timer here, so a nullish fallback would quietly hand back 45 minutes.
    stored({ lastTimerMinutes: null, sessionCount: 4 });
    const { result } = await setup('underwater');
    expect(result.current.timerMinutes).toBeNull();
  });

  it('takes the timer from Settings for a sound that has never been played', async () => {
    stored({ lastTimerMinutes: 15, sessionCount: 0 });
    const { result } = await setup('underwater', { ...DEFAULT_SETTINGS, defaultTimerMinutes: 60 });
    expect(result.current.timerMinutes).toBe(60);
  });

  it('honours a Settings default of no timer at all', async () => {
    const { result } = await setup('underwater', {
      ...DEFAULT_SETTINGS,
      defaultTimerMinutes: null,
    });
    expect(result.current.timerMinutes).toBeNull();
  });

  it('lets a choice made on the screen win over the remembered value', async () => {
    stored({ lastVolume: 0.31, lastTimerMinutes: 15, sessionCount: 4 });
    const { result } = await setup('underwater');

    act(() => result.current.setVolume(0.9));
    act(() => result.current.setTimerMinutes(60));

    expect(result.current.volume).toBe(0.9);
    expect(result.current.timerMinutes).toBe(60);
  });

  it('holds a chosen infinite timer rather than snapping back to the remembered one', async () => {
    stored({ lastTimerMinutes: 30, sessionCount: 4 });
    const { result } = await setup('underwater');

    act(() => result.current.setTimerMinutes(null));
    expect(result.current.timerMinutes).toBeNull();
  });

  it('holds a chosen volume of silence rather than reading it as no choice', async () => {
    stored({ lastVolume: 0.31, sessionCount: 4 });
    const { result } = await setup('underwater');

    act(() => result.current.setVolume(0));
    expect(result.current.volume).toBe(0);
  });
});

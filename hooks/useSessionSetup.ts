import { useState } from 'react';
import { useSoundStates } from '../context/SoundStateContext';
import { DEFAULT_SOUND_STATE } from '../store/soundState';
import type { SoundState } from '../store/soundState';
import type { Settings } from '../store/settings';

type Setup = {
  /** 0–1. */
  volume: number;
  setVolume: (value: number) => void;
  /** Minutes, or null for the ∞ timer. */
  timerMinutes: number | null;
  setTimerMinutes: (minutes: number | null) => void;
  /**
   * False until the remembered values are known. Playback waits for this, so a session
   * never opens at one volume and jumps to another a moment later.
   */
  ready: boolean;
};

/**
 * How a session opens: at the volume and timer this sound last used.
 *
 * The remembered values are derived rather than copied into state when they arrive. An
 * effect that synced them across would render once with the defaults before correcting
 * itself, which for volume is something you can hear.
 */
export function useSessionSetup(soundId: string | undefined, settings: Settings | null): Setup {
  const { ready: statesReady, stateFor } = useSoundStates();
  const [volumeChoice, setVolumeChoice] = useState<number | null>(null);
  /**
   * Boxed rather than a bare `number | null`, because null is a real timer — the ∞ pill —
   * and so cannot double as "the user has not touched the row".
   */
  const [timerChoice, setTimerChoice] = useState<{ minutes: number | null } | null>(null);

  const remembered =
    soundId && settings && statesReady ? rememberedFor(stateFor(soundId), settings) : null;

  return {
    ready: remembered !== null,
    // A choice made on this screen wins over the remembered value, and over the defaults
    // shown while the read is still in flight.
    volume: volumeChoice ?? remembered?.volume ?? DEFAULT_SOUND_STATE.lastVolume,
    setVolume: setVolumeChoice,
    // Both branches test the box rather than the value: a remembered ∞ timer is null, and
    // `??` here would quietly replace it with the 45 minute default.
    timerMinutes: timerChoice
      ? timerChoice.minutes
      : remembered
        ? remembered.timerMinutes
        : DEFAULT_SOUND_STATE.lastTimerMinutes,
    setTimerMinutes: (minutes) => setTimerChoice({ minutes }),
  };
}

function rememberedFor(state: SoundState, settings: Settings) {
  return {
    volume: state.lastVolume,
    // A sound played before resumes where it left off. One that never has takes the
    // default from Settings, which is the only thing that setting is for.
    timerMinutes: state.sessionCount === 0 ? settings.defaultTimerMinutes : state.lastTimerMinutes,
  };
}

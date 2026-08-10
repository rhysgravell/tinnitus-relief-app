import { SOUNDS, isPlayable } from './sounds';
import type { Sound } from './sounds';
import { DEFAULT_SOUND_STATE } from './soundState';
import type { SoundState, SoundStates } from './soundState';

/** A row on the Saved screen: the catalogue entry and what the user has done with it. */
export type SavedSound = {
  sound: Sound;
  state: SoundState;
  /**
   * The one sound the user reaches for more than any other. Only awarded when there is a
   * clear winner — calling a sound "most-played" against a tie, or against nothing, would
   * be telling the user something they have not done.
   */
  mostPlayed: boolean;
};

/**
 * The saved sounds, most-played first.
 *
 * Ordered by use rather than by the catalogue, because this screen exists to answer "what
 * worked last time" — the sound at the top should be the one most likely to be tapped.
 * Equal counts keep catalogue order, so the list does not reshuffle between visits.
 */
export function savedSounds(states: SoundStates): SavedSound[] {
  const ordered = SOUNDS.filter((sound) => states[sound.id]?.saved)
    .map((sound) => ({ sound, state: { ...DEFAULT_SOUND_STATE, ...states[sound.id] } }))
    .sort((a, b) => b.state.sessionCount - a.state.sessionCount);

  const hasFavourite =
    ordered.length > 1 && ordered[0].state.sessionCount > ordered[1].state.sessionCount;

  return ordered.map((entry, index) => ({ ...entry, mostPlayed: hasFavourite && index === 0 }));
}

/**
 * The context line under a saved sound's name — how much it has been used, and the timer
 * it will open on.
 *
 * The design also puts "notched" here. That belongs to the notch-filtering work, which
 * has not shipped, so claiming it would be a lie about what the sound is doing.
 */
export function savedMeta({ sound, state, mostPlayed }: SavedSound): string {
  if (!isPlayable(sound)) return 'Coming soon';
  // Nothing to promise about a sound that has never played: its session will open on the
  // default timer from Settings rather than on the untouched value stored here.
  if (state.sessionCount === 0) return 'Not played yet';

  const plays = mostPlayed
    ? 'Your most-played'
    : `${state.sessionCount} session${state.sessionCount === 1 ? '' : 's'}`;
  // Lower case, because this is the back half of a phrase rather than a label of its own.
  const timer = state.lastTimerMinutes === null ? 'no timer' : `${state.lastTimerMinutes}m`;

  return `${plays} · ${timer}`;
}

import { savedSounds } from './saved';
import { timerAccessibilityLabel, timerSettingLabel } from './settings';
import { SOUNDS, findSound, isPlayable } from './sounds';
import type { Sound } from './sounds';
import type { Session } from './sessions';
import type { SoundStates } from './soundState';

/**
 * What tonight's wind-down will play.
 *
 * Nothing on the Sleep screen asks the user to choose a sound, because at 22:30 the answer
 * is almost always "the same as last night". So: last night's, then the saved one they
 * reach for most, then simply the first thing that will play. Each fallback is a step
 * further from what they have told us and closer to a guess, but none of them is nothing.
 */
export function tonightSound(session: Session | null, states: SoundStates): Sound | undefined {
  const last = session ? findSound(session.soundId) : undefined;
  if (last && isPlayable(last)) return last;

  const saved = savedSounds(states).find(({ sound }) => isPlayable(sound));
  if (saved) return saved.sound;

  return SOUNDS.find(isPlayable);
}

/**
 * The line under "Wind-down at 22:30" — how long it will run and what it will play.
 *
 * The length is the default timer from Settings rather than whatever last night ran on: it
 * describes a session that has not started yet, and that is the length it will open at.
 */
export function tonightSummary(sound: Sound | undefined, timerMinutes: number | null): string {
  return composeSummary(sound, timerSettingLabel(timerMinutes), ' · ');
}

/**
 * The same line for a screen reader, which says "45 min" as forty-five metres and reads the
 * middle dot as nothing at all — so whole words, and a comma to pause on.
 */
export function tonightSpokenSummary(
  sound: Sound | undefined,
  timerMinutes: number | null
): string {
  return composeSummary(sound, timerAccessibilityLabel(timerMinutes), ', ');
}

/**
 * Both readings of the line, so the wording can only ever differ in the timer and the
 * separator — the two things a screen reader needs said differently.
 */
function composeSummary(
  sound: Sound | undefined,
  length: string,
  separator: string
): string {
  // Prose either way, so there is nothing here to say differently.
  if (!sound) return 'No sounds available to play';
  return `${length}${separator}${sound.name}`;
}

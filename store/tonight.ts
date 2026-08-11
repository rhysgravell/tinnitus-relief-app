import { savedSounds } from './saved';
import { SOUNDS, findSound, isPlayable } from './sounds';
import type { Sound } from './sounds';
import type { LastSession } from './sessions';
import type { SoundStates } from './soundState';

/**
 * What tonight's wind-down will play.
 *
 * Nothing on the Sleep screen asks the user to choose a sound, because at 22:30 the answer
 * is almost always "the same as last night". So: last night's, then the saved one they
 * reach for most, then simply the first thing that will play. Each fallback is a step
 * further from what they have told us and closer to a guess, but none of them is nothing.
 */
export function tonightSound(session: LastSession | null, states: SoundStates): Sound | undefined {
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
  if (!sound) return 'No sounds available to play';
  const length = timerMinutes === null ? 'No timer' : `${timerMinutes} min`;
  return `${length} · ${sound.name}`;
}

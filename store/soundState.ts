import { readJson, removeKey, updateJson } from './storage';
import { findSound } from './sounds';

const KEY = 'soundState';

/** Where the app kept favourites before the redesign folded them into sound state. */
const LEGACY_FAVOURITES_KEY = 'favourites';

/**
 * Per-sound state the user builds up by using the app, kept apart from the catalogue in
 * `sounds.ts` so that shipping new artwork or copy never touches user data.
 */
export type SoundState = {
  saved: boolean;
  /** 0–1, as the session slider reports it. */
  lastVolume: number;
  /** Minutes, or null for no timer — the ∞ pill. */
  lastTimerMinutes: number | null;
  sessionCount: number;
};

export const DEFAULT_SOUND_STATE: SoundState = {
  saved: false,
  lastVolume: 0.68,
  lastTimerMinutes: 45,
  sessionCount: 0,
};

export type SoundStates = Record<string, SoundState>;

export async function getSoundStates(): Promise<SoundStates> {
  return readJson<SoundStates>(KEY, {});
}

/** Falls back to the defaults for a sound the user has never opened. */
export async function getSoundState(id: string): Promise<SoundState> {
  const states = await getSoundStates();
  return states[id] ?? DEFAULT_SOUND_STATE;
}

/**
 * Changes one sound's state, queued behind any other change to the same key.
 *
 * The old state is read inside the update rather than passed in, because that read is half
 * of what has to be atomic: two stars tapped a moment apart both read the same copy, and
 * the second write would drop the first one's star.
 */
function change(id: string, next: (current: SoundState) => Partial<SoundState>) {
  return updateJson<SoundStates>(KEY, {}, (states) => {
    const current = { ...DEFAULT_SOUND_STATE, ...states[id] };
    return { ...states, [id]: { ...current, ...next(current) } };
  });
}

export async function toggleSaved(id: string): Promise<boolean> {
  const states = await change(id, ({ saved }) => ({ saved: !saved }));
  return states[id].saved;
}

export async function getSavedIds(): Promise<string[]> {
  const states = await getSoundStates();
  return Object.keys(states).filter((id) => states[id].saved);
}

/**
 * Carries pre-redesign favourites into sound state, then drops the old key.
 *
 * The redesign replaced a flat list of ids with per-sound state, and without this a
 * returning user's saved list would look wiped by the update. Runs on every launch but
 * does nothing once the old key is gone, which is the point — it needs no flag of its own.
 */
export async function migrateFavourites(): Promise<void> {
  // Read as unknown: this is data written by a version of the app that is no longer here
  // to be reasoned about, so nothing about its shape can be assumed.
  const favourites = await readJson<unknown>(LEGACY_FAVOURITES_KEY, null);
  if (!Array.isArray(favourites)) return;

  await updateJson<SoundStates>(KEY, {}, (states) => {
    const migrated: SoundStates = { ...states };
    for (const id of favourites) {
      // A sound the old build shipped may have left the catalogue since, and saving state
      // against an id nothing can show would strand it.
      if (typeof id !== 'string' || !findSound(id)) continue;
      migrated[id] = { ...DEFAULT_SOUND_STATE, ...migrated[id], saved: true };
    }
    return migrated;
  });
  await removeKey(LEGACY_FAVOURITES_KEY);
}

/**
 * Remembers how the session was set up so the next launch resumes exactly there, and
 * counts the session for the "14 sessions" context line on Saved.
 */
export async function recordSession(
  id: string,
  settings: { volume: number; timerMinutes: number | null }
): Promise<SoundState> {
  const states = await change(id, ({ sessionCount }) => ({
    lastVolume: settings.volume,
    lastTimerMinutes: settings.timerMinutes,
    // Counted off the stored value inside the update, so two sessions landing together
    // count two rather than both counting the same one.
    sessionCount: sessionCount + 1,
  }));
  return states[id];
}

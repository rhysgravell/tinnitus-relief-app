import { readJson, writeJson } from './storage';

const KEY = 'soundState';

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

async function update(id: string, patch: Partial<SoundState>): Promise<SoundStates> {
  const states = await getSoundStates();
  const next: SoundStates = {
    ...states,
    [id]: { ...DEFAULT_SOUND_STATE, ...states[id], ...patch },
  };
  await writeJson(KEY, next);
  return next;
}

export async function toggleSaved(id: string): Promise<boolean> {
  const { saved } = await getSoundState(id);
  await update(id, { saved: !saved });
  return !saved;
}

export async function getSavedIds(): Promise<string[]> {
  const states = await getSoundStates();
  return Object.keys(states).filter((id) => states[id].saved);
}

/**
 * Remembers how the session was set up so the next launch resumes exactly there, and
 * counts the session for the "14 sessions" context line on Saved.
 */
export async function recordSession(
  id: string,
  settings: { volume: number; timerMinutes: number | null }
): Promise<SoundState> {
  const { sessionCount } = await getSoundState(id);
  const next = await update(id, {
    lastVolume: settings.volume,
    lastTimerMinutes: settings.timerMinutes,
    sessionCount: sessionCount + 1,
  });
  return next[id];
}

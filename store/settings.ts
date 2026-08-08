import { readJson, writeJson } from './storage';

const KEY = 'settings';

export type Settings = {
  /** Minutes, or null for no timer. Seeds a sound's timer the first time it is played. */
  defaultTimerMinutes: number | null;
  /** Fade playback out over the last 30 seconds rather than cutting it off. */
  fadeOut: boolean;
  /** "Play over other apps" — whether to duck or mix with other audio. */
  mixWithOthers: boolean;
  /** Adopt the night palette on the light screens after local sunset. */
  darkAfterSunset: boolean;
  /** "HH:mm" local time for the daily check-in reminder, or null for none. */
  reminderTime: string | null;
};

export const DEFAULT_SETTINGS: Settings = {
  defaultTimerMinutes: 45,
  fadeOut: true,
  mixWithOthers: false,
  darkAfterSunset: true,
  reminderTime: '21:00',
};

export async function getSettings(): Promise<Settings> {
  // Spread over the defaults so a build that adds a setting reads sensibly against
  // state written by the build before it.
  const stored = await readJson<Partial<Settings>>(KEY, {});
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch };
  await writeJson(KEY, next);
  return next;
}

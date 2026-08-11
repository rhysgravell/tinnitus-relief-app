import { readJson, writeJson } from './storage';
import { formatTimeOfDay, parseTimeOfDay } from '../utils/time';
import type { TimeOfDay } from '../utils/time';

const KEY = 'settings';

/**
 * When the wind-down reminder fires unless it has been changed. Held as a clock time and
 * formatted into the stored string, so the two cannot disagree.
 */
const DEFAULT_WIND_DOWN: TimeOfDay = { hour: 22, minute: 30 };

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
  /** Whether the nightly wind-down reminder is scheduled. */
  windDownEnabled: boolean;
  /** "HH:mm" local time the wind-down reminder fires at. */
  windDownTime: string;
};

export const DEFAULT_SETTINGS: Settings = {
  defaultTimerMinutes: 45,
  fadeOut: true,
  mixWithOthers: false,
  darkAfterSunset: true,
  reminderTime: '21:00',
  // Off until asked for. Turning it on needs the OS's permission, and asking for that
  // before the user has shown any interest in a reminder is the wrong way round.
  windDownEnabled: false,
  windDownTime: formatTimeOfDay(DEFAULT_WIND_DOWN),
};

/**
 * The wind-down time as a clock time rather than a string, falling back to the default for
 * a stored value that is not a time at all. Everything downstream — the card, the
 * scheduler — can then take a real hour and minute and stop worrying about the format.
 */
export function windDownAt(settings: Settings): TimeOfDay {
  return parseTimeOfDay(settings.windDownTime) ?? DEFAULT_WIND_DOWN;
}

/**
 * The timer lengths on offer, in the order the design lays them out. Null is the ∞ pill —
 * play until stopped. They live here rather than on the Session screen because Settings
 * offers the same list for the default.
 */
export const TIMER_OPTIONS: readonly (number | null)[] = [15, 30, 45, 60, null];

/** What a timer length reads as on a pill. */
export function timerLabel(minutes: number | null): string {
  return minutes === null ? '∞' : `${minutes}m`;
}

/**
 * What a timer length is read out as. The pill labels are glyphs and abbreviations, which
 * assistive tech either spells out or skips.
 */
export function timerAccessibilityLabel(minutes: number | null): string {
  return minutes === null ? 'No timer' : `${minutes} minutes`;
}

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

import { readJson, writeJson } from './storage';
import { formatTimeOfDay, parseTimeOfDay } from '../utils/time';
import type { ReminderKind } from './reminders';
import type { TimeOfDay } from '../utils/time';

const KEY = 'settings';

/**
 * When each reminder fires unless it has been changed. Held as clock times and formatted
 * into the stored strings, so the two cannot disagree.
 */
const DEFAULT_TIMES: Record<ReminderKind, TimeOfDay> = {
  windDown: { hour: 22, minute: 30 },
  checkIn: { hour: 21, minute: 0 },
};

export type Settings = {
  /** Minutes, or null for no timer. Seeds a sound's timer the first time it is played. */
  defaultTimerMinutes: number | null;
  /** Fade playback out over the last 30 seconds rather than cutting it off. */
  fadeOut: boolean;
  /** "Play over other apps" — whether to duck or mix with other audio. */
  mixWithOthers: boolean;
  /** Adopt the night palette on the light screens after local sunset. */
  darkAfterSunset: boolean;
  /**
   * Each reminder is an enabled flag and an "HH:mm" local time, in the same shape, so one
   * hook and one settings row can serve both.
   */
  windDownEnabled: boolean;
  windDownTime: string;
  checkInEnabled: boolean;
  checkInTime: string;
};

export const DEFAULT_SETTINGS: Settings = {
  defaultTimerMinutes: 45,
  fadeOut: true,
  mixWithOthers: false,
  darkAfterSunset: true,
  // Both off until asked for. Turning one on needs the OS's permission, and asking for
  // that before the user has shown any interest in a reminder is the wrong way round.
  windDownEnabled: false,
  windDownTime: formatTimeOfDay(DEFAULT_TIMES.windDown),
  checkInEnabled: false,
  checkInTime: formatTimeOfDay(DEFAULT_TIMES.checkIn),
};

/** A reminder's state, in the shape the hook, the row and the scheduler all work in. */
export type ReminderSetting = { enabled: boolean; at: TimeOfDay };

/**
 * A reminder's stored state, with its time as a clock time rather than a string and the
 * default standing in for a stored value that is not a time at all. Everything downstream
 * can then take a real hour and minute and stop worrying about the format.
 */
export function reminderSetting(settings: Settings, kind: ReminderKind): ReminderSetting {
  const stored =
    kind === 'windDown'
      ? { enabled: settings.windDownEnabled, time: settings.windDownTime }
      : { enabled: settings.checkInEnabled, time: settings.checkInTime };

  return { enabled: stored.enabled, at: parseTimeOfDay(stored.time) ?? DEFAULT_TIMES[kind] };
}

/**
 * The patch that stores a reminder's state. Both of its keys are written together: the
 * time and the switch describe one thing, and a half-written change would schedule a
 * reminder for a time that is not the one on screen.
 */
export function reminderPatch(
  kind: ReminderKind,
  { enabled, at }: ReminderSetting
): Partial<Settings> {
  const time = formatTimeOfDay(at);

  return kind === 'windDown'
    ? { windDownEnabled: enabled, windDownTime: time }
    : { checkInEnabled: enabled, checkInTime: time };
}

/** The evening, in half hours — the range both reminders sit in. */
const REMINDER_FROM_HOUR = 19;
const REMINDER_TO_HOUR = 23;

/**
 * The times a reminder can be set to.
 *
 * A short list of presets rather than a wheel, for the same reason `TIMER_OPTIONS` is a
 * row of pills: this gets set in bed, so every option is one tap. Half an hour is as
 * precise as a nightly nudge needs to be, and both reminders — wind down, and log the day
 * — belong to the evening.
 */
export const REMINDER_TIMES: readonly TimeOfDay[] = Array.from(
  { length: (REMINDER_TO_HOUR - REMINDER_FROM_HOUR + 1) * 2 },
  (_, index) => ({
    hour: REMINDER_FROM_HOUR + Math.floor(index / 2),
    minute: index % 2 === 0 ? 0 : 30,
  })
);

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

/** The same length on a settings row, where there is room for the word. */
export function timerSettingLabel(minutes: number | null): string {
  return minutes === null ? 'No timer' : `${minutes} min`;
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

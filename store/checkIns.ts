import { readJson, updateJson } from './storage';
import { NIGHT_UNTIL_HOUR } from '../utils/time';

const KEY = 'checkIns';

/** Single-select chips on the Check-in screen. No emoji — these render as words. */
export type Mood = 'calm' | 'tired' | 'anxious' | 'frustrated' | 'low' | 'good';

export const MOOD_OPTIONS: { id: Mood; label: string }[] = [
  { id: 'calm', label: 'Calm' },
  { id: 'tired', label: 'Tired' },
  { id: 'anxious', label: 'Anxious' },
  { id: 'frustrated', label: 'Frustrated' },
  { id: 'low', label: 'Low' },
  { id: 'good', label: 'Good' },
];

/** 1 is "Barely there", 5 is "Overwhelming". */
export type Loudness = 1 | 2 | 3 | 4 | 5;

export const LOUDNESS_LEVELS: readonly Loudness[] = [1, 2, 3, 4, 5];

/**
 * Only the two ends of the scale are named. Naming all five would ask the user to agree
 * with a word for their own tinnitus; the ends set the range and the rest is theirs.
 */
export const LOUDNESS_ENDS = { low: 'Barely there', high: 'Overwhelming' } as const;

/**
 * What a bar on the scale is read out as.
 *
 * The row of rising bars is what tells a sighted user which end is which, and the two words
 * sit underneath it as loose text — neither of which reaches a screen reader, which was
 * offered five numbered buttons and no direction. So the end bars carry their own word.
 *
 * The middle three stay numbers, for the same reason only the ends are named on screen: a
 * word for someone's own tinnitus is theirs to pick, and the ends are there to set the range
 * rather than to label the answer.
 */
export function loudnessLabel(level: Loudness): string {
  const position = `Level ${level} of ${LOUDNESS_LEVELS.length}`;
  // The words exactly as they are drawn, rather than a spoken copy of them to keep in step.
  if (level === LOUDNESS_LEVELS[0]) return `${position}, ${LOUDNESS_ENDS.low}`;
  if (level === LOUDNESS_LEVELS[LOUDNESS_LEVELS.length - 1]) {
    return `${position}, ${LOUDNESS_ENDS.high}`;
  }
  return position;
}

export type CheckIn = {
  /** "YYYY-MM-DD" local date. One check-in per day. */
  date: string;
  loudness: Loudness;
  mood: Mood;
};

/** The trend needs three entries before the generated insight sentence is shown. */
export const MIN_ENTRIES_FOR_TREND = 3;

/** A date's "YYYY-MM-DD" key. Also what the trend window is built out of. */
export function localDate(date: Date): string {
  // Built from local parts rather than toISOString, which would shift the date across
  // midnight for anyone west of UTC — precisely when this app gets used.
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * The date a moment is logged under. The app's day turns over at 5am, not at midnight:
 * a check-in filled in at 1am is about the night that has just been had, and `sessions.ts`
 * files a session that ran past midnight under the same night. Dating the two differently
 * is what made the trend's sentence miss exactly the sessions it was meant to count.
 */
export function nightDate(now: Date = new Date()): string {
  return localDate(nightAnchor(now));
}

/**
 * Midday on the night a moment belongs to — the date, as a date, for stepping back through
 * a window of days. Midday rather than midnight so a clock change, where a day is 23 hours
 * long, cannot carry the arithmetic onto the wrong date.
 */
export function nightAnchor(now: Date): Date {
  const night = new Date(now);
  if (night.getHours() < NIGHT_UNTIL_HOUR) night.setDate(night.getDate() - 1);
  night.setHours(12, 0, 0, 0);
  return night;
}

/** What the screen calls the stretch of time it is asking about. */
export type CheckInDay = 'today' | 'last night';

/**
 * Which of those two the screen is filing under right now.
 *
 * Derived by asking `nightDate` rather than by restating the 5am rule, so the wording
 * follows the filing wherever the turnover is moved to. Before 5am the two disagree — the
 * entry goes under the night just had, which on the calendar was yesterday.
 */
export function checkInDay(now: Date = new Date()): CheckInDay {
  return nightDate(now) === localDate(now) ? 'today' : 'last night';
}

/**
 * The screen's heading. Composed from the same noun as the save button so the two cannot
 * ask about one day and offer to save another — which is exactly what they did at 1am,
 * both saying "today" over an entry being filed under the night before.
 */
export function checkInQuestion(day: CheckInDay): string {
  return `How was ${day}?`;
}

/** Oldest first, so the trend chart can render straight from this. */
export async function getCheckIns(): Promise<CheckIn[]> {
  const stored = await readJson<CheckIn[]>(KEY, []);
  return [...stored].sort((a, b) => a.date.localeCompare(b.date));
}

/** Replaces the entry for that date, so checking in twice corrects rather than duplicates. */
export async function saveCheckIn(entry: CheckIn): Promise<CheckIn[]> {
  return updateJson<CheckIn[]>(KEY, [], (stored) =>
    [...stored.filter((c) => c.date !== entry.date), entry].sort((a, b) =>
      a.date.localeCompare(b.date)
    )
  );
}

/** What the screen has collected so far. Either answer can still be missing. */
export type CheckInDraft = { loudness: Loudness | null; mood: Mood | null };

export const EMPTY_DRAFT: CheckInDraft = { loudness: null, mood: null };

/**
 * Where the draft stands against what is already stored for the day. The save button reads
 * this rather than tracking its own flags, so it can never claim to have saved something
 * that has since been changed.
 */
export type DraftStatus = 'incomplete' | 'new' | 'changed' | 'saved';

export function draftStatus(draft: CheckInDraft, stored: CheckIn | undefined): DraftStatus {
  if (draft.loudness === null || draft.mood === null) return 'incomplete';
  if (!stored) return 'new';
  const same = stored.loudness === draft.loudness && stored.mood === draft.mood;
  return same ? 'saved' : 'changed';
}

/**
 * The button's label. It doubles as the confirmation: there is no toast in this design, so
 * the word going from "Save today" to "Saved" is how the app says it landed.
 *
 * Names the day it will write, which before 5am is the night before — offering to "save
 * today" at 1am promised the wrong day, and the heading above it agreed.
 */
export function saveLabel(status: DraftStatus, day: CheckInDay): string {
  if (status === 'saved') return 'Saved';
  return `${status === 'changed' ? 'Update' : 'Save'} ${day}`;
}

export function draftFrom(entry: CheckIn | undefined): CheckInDraft {
  return entry ? { loudness: entry.loudness, mood: entry.mood } : EMPTY_DRAFT;
}

import { readJson, writeJson } from './storage';

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

export function today(now: Date = new Date()): string {
  return localDate(now);
}

/** Oldest first, so the trend chart can render straight from this. */
export async function getCheckIns(): Promise<CheckIn[]> {
  const stored = await readJson<CheckIn[]>(KEY, []);
  return [...stored].sort((a, b) => a.date.localeCompare(b.date));
}

/** Replaces the entry for that date, so checking in twice corrects rather than duplicates. */
export async function saveCheckIn(entry: CheckIn): Promise<CheckIn[]> {
  const others = (await getCheckIns()).filter((c) => c.date !== entry.date);
  const next = [...others, entry].sort((a, b) => a.date.localeCompare(b.date));
  await writeJson(KEY, next);
  return next;
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
 */
export function saveLabel(status: DraftStatus): string {
  if (status === 'saved') return 'Saved';
  return status === 'changed' ? 'Update today' : 'Save today';
}

export function draftFrom(entry: CheckIn | undefined): CheckInDraft {
  return entry ? { loudness: entry.loudness, mood: entry.mood } : EMPTY_DRAFT;
}

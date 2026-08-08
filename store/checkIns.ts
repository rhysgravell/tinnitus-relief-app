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

export type CheckIn = {
  /** "YYYY-MM-DD" local date. One check-in per day. */
  date: string;
  loudness: Loudness;
  mood: Mood;
};

/** The trend needs three entries before the generated insight sentence is shown. */
export const MIN_ENTRIES_FOR_TREND = 3;

export function today(now: Date = new Date()): string {
  // Built from local parts rather than toISOString, which would shift the date across
  // midnight for anyone west of UTC — precisely when this app gets used.
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
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

export async function getCheckIn(date: string): Promise<CheckIn | undefined> {
  return (await getCheckIns()).find((c) => c.date === date);
}

/** The most recent `days` entries, oldest first — "LAST 14 DAYS" on the trend header. */
export async function getRecentCheckIns(days: number): Promise<CheckIn[]> {
  return (await getCheckIns()).slice(-days);
}

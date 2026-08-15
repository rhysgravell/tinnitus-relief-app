/**
 * Time-of-day wording. Both of these are pure functions taking the current time as an
 * argument rather than reading the clock themselves, so the awkward cases — 2am, the
 * boundary at noon, a session that ran across midnight — are testable.
 */

/** Where the greeting changes over, in whole hours of the local day. */
const AFTERNOON_FROM = 12;
const EVENING_FROM = 18;

/**
 * The line above the title on Sounds. There is no name to address the user by — nothing
 * in the app collects one, since the onboarding screen that would is deferred — so the
 * greeting stands alone rather than inventing a placeholder.
 */
export function greetingFor(now: Date): string {
  const hour = now.getHours();
  if (hour >= EVENING_FROM) return 'Good evening';
  if (hour >= AFTERNOON_FROM) return 'Good afternoon';
  return 'Good morning';
}

/** A time on the clock, with no date attached — what a reminder is set to. */
export type TimeOfDay = { hour: number; minute: number };

/**
 * Reads an "HH:mm" setting.
 *
 * Returns null for anything that is not a real time, so a value written by another build
 * or a corrupt entry cannot end up scheduling a reminder for hour 47.
 */
export function parseTimeOfDay(value: string): TimeOfDay | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;

  return { hour, minute };
}

/** "22:30" — the 24 hour clock the design writes these in. */
export function formatTimeOfDay({ hour, minute }: TimeOfDay): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(hour)}:${pad(minute)}`;
}

/**
 * The same time as it should be spoken: "10:30 pm", "9 pm". Assistive tech reads "22:30"
 * out as a pair of numbers, and the on-screen 24 hour clock is the design's, not the
 * user's — they may never have thought of half ten as 22:30.
 */
export function spokenTimeOfDay({ hour, minute }: TimeOfDay): string {
  const period = hour < 12 ? 'am' : 'pm';
  // Midnight and midday are 12, not 0 — the modulo gives 0 for both.
  const onTheClock = hour % 12 === 0 ? 12 : hour % 12;
  return minute === 0
    ? `${onTheClock} ${period}`
    : `${onTheClock}:${String(minute).padStart(2, '0')} ${period}`;
}

/**
 * Sessions before this hour belong to the night before — for the wording here, and for
 * the night a session is filed under in `store/sessions.ts`.
 */
export const NIGHT_UNTIL_HOUR = 5;

/**
 * How the resume card refers to when the last session ran: "Last night", "Yesterday",
 * "3 days ago". Deliberately vague — the exact minute is not why anyone reads this line.
 */
export function relativeDayLabel(when: Date, now: Date): string {
  const days = wholeDaysBetween(when, now);

  if (days <= 0) {
    // Something that finished at 1am today is colloquially last night, not this morning.
    return when.getHours() < NIGHT_UNTIL_HOUR ? 'Last night' : 'Earlier today';
  }

  if (days === 1) {
    return when.getHours() >= EVENING_FROM ? 'Last night' : 'Yesterday';
  }

  return days < 7 ? `${days} days ago` : 'Over a week ago';
}

/**
 * Calendar days apart, not elapsed hours: 11pm to 7am the next morning is one day, which
 * is how a person would describe it.
 */
function wholeDaysBetween(when: Date, now: Date): number {
  const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(now) - startOfDay(when)) / msPerDay);
}

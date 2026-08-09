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

/** Sessions before this hour belong to the night before, as far as the wording goes. */
const NIGHT_UNTIL = 5;

/**
 * How the resume card refers to when the last session ran: "Last night", "Yesterday",
 * "3 days ago". Deliberately vague — the exact minute is not why anyone reads this line.
 */
export function relativeDayLabel(when: Date, now: Date): string {
  const days = wholeDaysBetween(when, now);

  if (days <= 0) {
    // Something that finished at 1am today is colloquially last night, not this morning.
    return when.getHours() < NIGHT_UNTIL ? 'Last night' : 'Earlier today';
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

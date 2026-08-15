import { localDate, MIN_ENTRIES_FOR_TREND } from './checkIns';
import type { CheckIn } from './checkIns';

/** The window the trend opens on, and the wider one behind "See more". */
export const TREND_DAYS = 14;
export const TREND_DAYS_WIDE = 30;

/**
 * How much the average has to move before the caption calls it a direction rather than
 * steady. Below half a point on a five-point scale is a mood, not a trend.
 */
const MEANINGFUL_CHANGE = 0.5;

/** One column of the chart. `entry` is absent on a day that was not logged. */
export type TrendDay = { date: string; entry: CheckIn | undefined };

/**
 * The last `days` calendar days, oldest first, whether or not each was logged.
 *
 * Built from dates rather than from the last `days` entries so the chart's spacing is time:
 * a week of silence has to read as a gap, not close up as if it never happened.
 */
export function trendWindow(
  entries: CheckIn[],
  days: number,
  now: Date = new Date()
): TrendDay[] {
  const byDate = new Map(entries.map((entry) => [entry.date, entry]));
  const window: TrendDay[] = [];

  for (let back = days - 1; back >= 0; back -= 1) {
    const date = new Date(now);
    // Stepping back from midday keeps the arithmetic on the right date through a clock
    // change, where a day is 23 hours long and midnight minus 24 hours lands on itself.
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - back);
    const key = localDate(date);
    window.push({ date: key, entry: byDate.get(key) });
  }

  return window;
}

/** The entries inside a window, oldest first — what the caption is written from. */
export function loggedDays(window: TrendDay[]): CheckIn[] {
  return window.flatMap(({ entry }) => (entry ? [entry] : []));
}

/** Whether anything sits before the window — which is what the wider view would show. */
export function hasEarlierThan(entries: CheckIn[], window: TrendDay[]): boolean {
  const first = window[0]?.date;
  return first !== undefined && entries.some((entry) => entry.date < first);
}

/**
 * How many check-ins each side of the comparison needs before the nights with a session
 * are worth setting against the nights without. One of each is a pair of days, not a
 * pattern.
 */
const MIN_PER_SIDE = 2;

/**
 * The sentence under the chart.
 *
 * Where there are sessions to correlate against, it says what they line up with — which is
 * the question someone is actually asking of this screen. Otherwise it compares the recent
 * half of the window against the earlier half, because the useful question is not how loud
 * today was but whether it is going anywhere. Under three check-ins there is no answer to
 * give, so it says what it is waiting for instead.
 */
export function trendCaption(window: TrendDay[], nights: ReadonlySet<string> = new Set()): string {
  const logged = loggedDays(window);

  if (logged.length === 0) {
    return 'Check in for a few days and your own pattern shows up here.';
  }

  if (logged.length < MIN_ENTRIES_FOR_TREND) {
    const remaining = MIN_ENTRIES_FOR_TREND - logged.length;
    return remaining === 1
      ? 'One more check-in and this starts to show a direction.'
      : `${remaining} more check-ins and this starts to show a direction.`;
  }

  const againstSessions = sessionComparison(window, logged, nights);
  if (againstSessions) return againstSessions;

  const half = Math.floor(logged.length / 2);
  const recent = mean(logged.slice(-half));
  const earlier = mean(logged.slice(0, logged.length - half));
  const change = recent - earlier;

  if (Math.abs(change) < MEANINGFUL_CHANGE) {
    return `Holding steady, averaging ${format(mean(logged))} across ${logged.length} check-ins.`;
  }

  const direction = change < 0 ? 'Quieter' : 'Louder';
  return `${direction} lately — averaging ${format(recent)}, against ${format(earlier)} before that.`;
}

/**
 * The nights a session ran on, set against the nights one did not, or null when there is
 * not enough of either to say anything.
 *
 * The tally is every night in the window a session ran on, logged or not — "11 of the last
 * 14" is a count of nights, not of check-ins. Which way round the cause runs is left alone:
 * a loud night is a reason to reach for a session as much as the other way about, and this
 * screen reports what the user's own log says rather than explaining it to them.
 */
function sessionComparison(
  window: TrendDay[],
  logged: CheckIn[],
  nights: ReadonlySet<string>
): string | null {
  const withSession = logged.filter(({ date }) => nights.has(date));
  const without = logged.filter(({ date }) => !nights.has(date));
  if (withSession.length < MIN_PER_SIDE || without.length < MIN_PER_SIDE) return null;

  const ran = window.filter(({ date }) => nights.has(date)).length;
  const tally = `${ran} of the last ${window.length}`;
  const change = mean(withSession) - mean(without);

  if (Math.abs(change) < MEANINGFUL_CHANGE) {
    return `About the same either way — you ran a session on ${tally} nights.`;
  }

  return change < 0
    ? `Quieter on the nights you ran a session — ${tally}.`
    : `Louder on the nights you ran a session — ${tally}.`;
}

/**
 * What a screen reader gets in place of the bars. The shape of a chart is no use read out
 * column by column, so this is the summary a sighted user takes from it at a glance.
 */
export function chartLabel(window: TrendDay[]): string {
  const logged = loggedDays(window);
  if (logged.length === 0) return `No check-ins in the last ${window.length} days.`;

  const levels = logged.map(({ loudness }) => loudness);
  const count = logged.length === 1 ? '1 check-in' : `${logged.length} check-ins`;
  return `Loudness, ${count} over ${window.length} days: from ${Math.min(...levels)} to ${Math.max(
    ...levels
  )}, most recently ${levels[levels.length - 1]}.`;
}

function mean(entries: CheckIn[]): number {
  return entries.reduce((total, { loudness }) => total + loudness, 0) / entries.length;
}

/** One decimal, and no trailing ".0" — "3" reads better than "3.0" in a sentence. */
function format(value: number): string {
  return `${Math.round(value * 10) / 10}`;
}

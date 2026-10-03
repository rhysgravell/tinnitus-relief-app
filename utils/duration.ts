/**
 * Formatting for elapsed and remaining time. Kept apart from `time.ts`, which is about
 * wording a moment ("Last night"); this is about counting a span.
 */

/**
 * A running clock: "0:07", "32:14", "1:04:20". Minutes are not zero-padded, matching the
 * design's readout, and the hours field only appears once it is needed — a session on the
 * ∞ timer can run all night, but the common case is under an hour and reads better short.
 */
export function formatClock(totalSeconds: number): string {
  // Negative input would otherwise format as "-1:-30". A clock has no reverse.
  const whole = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const seconds = whole % 60;
  const pad = (value: number) => String(value).padStart(2, '0');

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/**
 * The same span in words: "7 seconds", "32 minutes, 14 seconds", "1 hour, 4 minutes".
 *
 * A clock face is the one thing on the session screen that is pure digits, and "32:14" is
 * read out as the characters it is made of — or, worse, as a time of day. Spans are said in
 * units, with commas to pause on.
 *
 * A field that is zero is left out rather than read as "0 minutes", because a span of
 * exactly an hour is "1 hour" and not "1 hour, 0 minutes, 0 seconds". Nothing at all is
 * still a reading, though: it is where the clock starts and where a timer ends.
 */
export function spokenClock(totalSeconds: number): string {
  // Floored and never negative, the same two guards `formatClock` applies, so the two
  // readings of one clock cannot disagree about which second it is on.
  const whole = Math.max(0, Math.floor(totalSeconds));
  const fields: [number, string][] = [
    [Math.floor(whole / 3600), 'hour'],
    [Math.floor((whole % 3600) / 60), 'minute'],
    [whole % 60, 'second'],
  ];

  const said = fields
    .filter(([value]) => value > 0)
    .map(([value, unit]) => `${value} ${unit}${value === 1 ? '' : 's'}`);

  return said.length > 0 ? said.join(', ') : '0 seconds';
}

/**
 * How long a session ran, in whole minutes, for the resume card and the history. Rounded
 * rather than truncated so a 44m 40s session is not recorded as 44 — but floored at 1,
 * because "0 min" reads as a session that never happened.
 */
export function wholeMinutes(totalSeconds: number): number {
  return Math.max(1, Math.round(totalSeconds / 60));
}

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
 * How long a session ran, in whole minutes, for the resume card and the history. Rounded
 * rather than truncated so a 44m 40s session is not recorded as 44 — but floored at 1,
 * because "0 min" reads as a session that never happened.
 */
export function wholeMinutes(totalSeconds: number): number {
  return Math.max(1, Math.round(totalSeconds / 60));
}

/**
 * When the app dims itself.
 *
 * The setting is called "Dark after sunset", and real sunset would need the device's
 * location — a permission prompt and a native module, asked for on behalf of a colour.
 * So the app takes a fixed evening instead: dark from 19:00, light again at 06:00, local
 * time. It is early in June and late in December, and the honest name for it is a
 * stand-in.
 *
 * 19:00 is the earliest a reminder can be set to, so it is already the hour this app
 * treats as the start of the evening. The other end is 06:00 rather than first light
 * because someone awake at 5am with their ears ringing is exactly who this is for.
 */
export const DARK_FROM_HOUR = 19;
export const DARK_UNTIL_HOUR = 6;

/** Whether a moment falls inside the dark hours. */
export function isDarkHour(now: Date): boolean {
  const hour = now.getHours();
  return hour >= DARK_FROM_HOUR || hour < DARK_UNTIL_HOUR;
}

/**
 * A timer that fires a hair early would find nothing had changed yet and reschedule
 * itself for no time at all, over and over. A second's grace costs nothing.
 */
const MIN_DELAY_MS = 1000;

/**
 * How long until `isDarkHour` would answer differently, so the app can repaint itself on
 * the boundary rather than watch the clock for it.
 */
export function msUntilNextDarkChange(now: Date): number {
  const next = new Date(now);
  next.setMinutes(0, 0, 0);

  if (isDarkHour(now)) {
    // Evenings cross midnight on the way to morning; the small hours do not.
    if (now.getHours() >= DARK_UNTIL_HOUR) next.setDate(next.getDate() + 1);
    next.setHours(DARK_UNTIL_HOUR);
  } else {
    next.setHours(DARK_FROM_HOUR);
  }

  return Math.max(next.getTime() - now.getTime(), MIN_DELAY_MS);
}

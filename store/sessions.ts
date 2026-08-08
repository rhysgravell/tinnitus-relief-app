import { readJson, writeJson } from './storage';

const KEY = 'lastSession';

/**
 * The most recently finished session, which powers the resume card at the top of Sounds.
 * Null means a first-run user with no history, and the card is omitted entirely.
 *
 * The in-flight session is deliberately not persisted — it is runtime state owned by the
 * Session screen, and a half-finished session should not survive a force quit.
 */
export type LastSession = {
  soundId: string;
  /** ISO 8601. */
  endedAt: string;
  /** How long it actually ran, which is what the resume card reports. */
  durationMinutes: number;
  /** What the timer was set to, or null if there was none. */
  timerMinutes: number | null;
};

export async function getLastSession(): Promise<LastSession | null> {
  return readJson<LastSession | null>(KEY, null);
}

export async function setLastSession(session: LastSession): Promise<void> {
  await writeJson(KEY, session);
}

import { localDate } from './checkIns';
import { readJson, removeKey, updateJson, writeJson } from './storage';
import { NIGHT_UNTIL_HOUR } from '../utils/time';

const KEY = 'sessions';

/** Where the single most recent session lived before there was a log of them. */
const LEGACY_KEY = 'lastSession';

/**
 * A finished session. The most recent one powers the resume card at the top of Sounds;
 * the rest are what the check-in trend correlates loudness against.
 *
 * The in-flight session is deliberately not persisted — it is runtime state owned by the
 * Session screen, and a half-finished session should not survive a force quit.
 */
export type Session = {
  soundId: string;
  /**
   * ISO 8601, and the moment the sound stopped rather than the moment the screen was
   * closed — the two can be a night apart, and it is the first that says which night this
   * belongs to.
   */
  endedAt: string;
  /** How long it actually ran, which is what the resume card reports. */
  durationMinutes: number;
  /** What the timer was set to, or null if there was none. */
  timerMinutes: number | null;
};

/**
 * How far back the log goes. The widest thing that reads it looks at 30 days, so this is
 * already generous — and a log kept forever would grow without anything ever asking it to
 * stop, on a phone, for a screen that only ever shows the last few weeks.
 */
const KEEP_DAYS = 90;

/** Newest first, which is the order both readers of this want. */
export async function getSessions(): Promise<Session[]> {
  // Swallowed on purpose: the carry-over writes, and a write can fail. Reading the log is
  // what the resume card and the whole Check-in screen wait on, and neither of them has
  // anything to show if this rejects — a failed migration would blank them rather than
  // cost them one old session. The legacy key is still there, so the next launch tries
  // again.
  await carryOverLegacy().catch(() => {});

  return sortedNewestFirst(await readJson<Session[]>(KEY, []));
}

/**
 * Moves the one session the app used to keep into the log.
 *
 * An empty log may mean a first-run user or a build from before the log existed. The absent
 * legacy key is what tells the two apart, so it is dropped once carried over — which also
 * makes this do nothing on every launch after the first.
 */
async function carryOverLegacy(): Promise<void> {
  if ((await readJson<Session[]>(KEY, [])).length > 0) return;

  const legacy = await readJson<Session | null>(LEGACY_KEY, null);
  if (!legacy) return;

  await writeJson(KEY, [legacy]);
  await removeKey(LEGACY_KEY);
}

export async function addSession(session: Session): Promise<void> {
  // Carried over first, outside the update: it writes the same key, and doing it from
  // inside would be a write nested in a write.
  await carryOverLegacy();

  await updateJson<Session[]>(KEY, [], (stored) =>
    sortedNewestFirst([
      session,
      ...stored.filter((entry) => withinKeepWindow(entry, session.endedAt)),
    ])
  );
}

/** The session behind the resume card, or null for someone who has not run one yet. */
export async function getLastSession(): Promise<Session | null> {
  return (await getSessions())[0] ?? null;
}

/**
 * The nights a session ran on, as the date keys a check-in is filed under.
 *
 * A session that ended at 1am belongs to the night before — the same rule the resume
 * card's wording uses — so it lines up with the check-in for the day it was really part of.
 */
export function sessionNights(sessions: Session[]): Set<string> {
  return new Set(sessions.map(({ endedAt }) => nightOf(new Date(endedAt))));
}

function nightOf(when: Date): string {
  const night = new Date(when);
  if (night.getHours() < NIGHT_UNTIL_HOUR) night.setDate(night.getDate() - 1);
  return localDate(night);
}

function sortedNewestFirst(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => b.endedAt.localeCompare(a.endedAt));
}

function withinKeepWindow({ endedAt }: Session, now: string): boolean {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - KEEP_DAYS);
  return new Date(endedAt).getTime() >= cutoff.getTime();
}

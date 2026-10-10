import { useCallback, useState } from 'react';
import {
  checkInDay,
  draftFrom,
  draftStatus,
  EMPTY_DRAFT,
  getCheckIns,
  nightDate,
  saveCheckIn,
} from '../store/checkIns';
import { getSessions, sessionNights } from '../store/sessions';
import type {
  CheckIn,
  CheckInDay,
  CheckInDraft,
  DraftStatus,
  Loudness,
  Mood,
} from '../store/checkIns';

export type UseCheckIn = {
  /** False until the stored history has been read, so nothing renders half-known. */
  ready: boolean;
  /** Every check-in, oldest first — what the trend is drawn from. */
  entries: CheckIn[];
  /** The nights a session ran on, which is what the trend's sentence is written against. */
  nights: ReadonlySet<string>;
  /** Which day the screen should say it is asking about, for the heading and the button. */
  day: CheckInDay;
  draft: CheckInDraft;
  status: DraftStatus;
  setLoudness: (value: Loudness) => void;
  setMood: (value: Mood) => void;
  save: () => void;
  /**
   * Reads storage. The screen calls this on focus, which is both how the first read happens
   * and how the date rolls over on a screen that has been open all night.
   */
  refresh: () => Promise<void>;
};

/** The draft, and the date it is an answer about. They change together or not at all. */
type Answer = { date: string | null; draft: CheckInDraft };

const NO_ANSWER: Answer = { date: null, draft: EMPTY_DRAFT };

/** Nothing read yet, and nothing to correlate against — the caption falls back on its own. */
const EMPTY_NIGHTS: ReadonlySet<string> = new Set();

/**
 * Today's check-in and the history behind it.
 *
 * The draft is seeded from today's stored entry, so arriving back at the screen shows what
 * was logged rather than an empty form — checking in twice corrects the day instead of
 * adding a second one.
 *
 * Nothing is read until `refresh` is called. The screen calls it on focus, which covers the
 * first read too, so there is no mount read racing the focus one.
 */
export function useCheckIn(): UseCheckIn {
  const [entries, setEntries] = useState<CheckIn[] | null>(null);
  const [nights, setNights] = useState<ReadonlySet<string>>(EMPTY_NIGHTS);
  const [answer, setAnswer] = useState<Answer>(NO_ANSWER);
  // Read off the clock rather than out of storage, so the heading has something to say on
  // the first frame — it is the screen's title, and would otherwise open blank.
  const [day, setDay] = useState<CheckInDay>(checkInDay);

  const refresh = useCallback(async () => {
    // One reading of the clock for both, so the day the screen names and the date it
    // writes cannot come from either side of a tick.
    const now = new Date();
    const date = nightDate(now);
    // Set every time, unlike the draft below: between 11pm and 1am the night is the same
    // one and the date does not move, but the word for it goes from "today" to "last
    // night". Gating this on the date changing would leave the old word up all night.
    setDay(checkInDay(now));

    // Both at once: the sentence under the chart is written from the two together, and
    // reading them one after the other would put it on screen twice.
    const [stored, sessions] = await Promise.all([getCheckIns(), getSessions()]);
    setEntries(stored);
    setNights(sessionNights(sessions));

    // An answer half-given is left alone on the way back to the screen, but not carried
    // across the 5am turnover: it was about the night before.
    setAnswer((current) =>
      current.date === date
        ? current
        : { date, draft: draftFrom(stored.find((entry) => entry.date === date)) }
    );
  }, []);

  const setLoudness = useCallback((value: Loudness) => {
    setAnswer((current) => ({ ...current, draft: { ...current.draft, loudness: value } }));
  }, []);

  const setMood = useCallback((value: Mood) => {
    setAnswer((current) => ({ ...current, draft: { ...current.draft, mood: value } }));
  }, []);

  const { date: answeredDate, draft } = answer;

  const save = useCallback(() => {
    if (draft.loudness === null || draft.mood === null) return;
    // Read again rather than trusting `answeredDate`: the screen may have been open since
    // before the turnover, and the entry belongs to the night it is being written on.
    const now = new Date();
    const date = nightDate(now);
    setAnswer({ date, draft });
    // And the wording with it, so a save that crosses the turnover does not leave the
    // button naming the night it has just stopped writing to.
    setDay(checkInDay(now));
    // The button reads its own state off `entries`, so a write that never lands leaves it
    // still offering to save rather than claiming the day is logged. Nothing more to do here
    // than keep the failure from surfacing as a rejection nobody is listening for.
    void saveCheckIn({ date, loudness: draft.loudness, mood: draft.mood })
      .then(setEntries)
      .catch(() => {});
  }, [draft]);

  const list = entries ?? [];
  const stored =
    answeredDate === null ? undefined : list.find((entry) => entry.date === answeredDate);

  return {
    ready: entries !== null,
    entries: list,
    nights,
    day,
    draft,
    status: draftStatus(draft, stored),
    setLoudness,
    setMood,
    save,
    refresh,
  };
}

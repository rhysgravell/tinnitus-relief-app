import { useCallback, useState } from 'react';
import {
  draftFrom,
  draftStatus,
  EMPTY_DRAFT,
  getCheckIns,
  saveCheckIn,
  today,
} from '../store/checkIns';
import type { CheckIn, CheckInDraft, DraftStatus, Loudness, Mood } from '../store/checkIns';

export type UseCheckIn = {
  /** False until the stored history has been read, so nothing renders half-known. */
  ready: boolean;
  /** Every check-in, oldest first — what the trend is drawn from. */
  entries: CheckIn[];
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
type Answer = { day: string | null; draft: CheckInDraft };

const NO_ANSWER: Answer = { day: null, draft: EMPTY_DRAFT };

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
  const [answer, setAnswer] = useState<Answer>(NO_ANSWER);

  const refresh = useCallback(async () => {
    const date = today();
    const stored = await getCheckIns();
    setEntries(stored);

    // An answer half-given is left alone on the way back to the screen, but not carried
    // across midnight: it was about yesterday.
    setAnswer((current) =>
      current.day === date
        ? current
        : { day: date, draft: draftFrom(stored.find((entry) => entry.date === date)) }
    );
  }, []);

  const setLoudness = useCallback((value: Loudness) => {
    setAnswer((current) => ({ ...current, draft: { ...current.draft, loudness: value } }));
  }, []);

  const setMood = useCallback((value: Mood) => {
    setAnswer((current) => ({ ...current, draft: { ...current.draft, mood: value } }));
  }, []);

  const { day, draft } = answer;

  const save = useCallback(() => {
    if (draft.loudness === null || draft.mood === null) return;
    // Read again rather than trusting `day`: the screen may have been open since before
    // midnight, and the entry belongs to the date it is being written on.
    const date = today();
    setAnswer({ day: date, draft });
    void saveCheckIn({ date, loudness: draft.loudness, mood: draft.mood }).then(setEntries);
  }, [draft]);

  const list = entries ?? [];
  const stored = day === null ? undefined : list.find((entry) => entry.date === day);

  return {
    ready: entries !== null,
    entries: list,
    draft,
    status: draftStatus(draft, stored),
    setLoudness,
    setMood,
    save,
    refresh,
  };
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import {
  DEFAULT_SOUND_STATE,
  getSoundStates,
  migrateFavourites,
  toggleSaved as persistSaved,
} from '../store/soundState';
import type { SoundState, SoundStates } from '../store/soundState';

type SoundStateContextValue = {
  /** Only sounds the user has touched appear here; the rest fall back to the defaults. */
  states: SoundStates;
  /** False until the first read from storage has landed. */
  ready: boolean;
  stateFor: (id: string) => SoundState;
  toggleSaved: (id: string) => Promise<void>;
  /**
   * Re-reads storage. The session writes its counts and timers on the way out without
   * going through here, so a screen that shows them asks for a fresh read on focus.
   */
  refresh: () => Promise<void>;
};

const SoundStateContext = createContext<SoundStateContextValue | null>(null);

/**
 * Per-sound state — saved, last volume, last timer — shared across the screens that read
 * and write it. Sounds, Saved and Session all show the same star, so it cannot be loaded
 * per screen or a star tapped on one would be stale on the next.
 *
 * Provided at the root rather than inside the tab layout: Session is presented over the
 * tabs from the root stack, so a provider inside the tabs would not reach it.
 */
export function SoundStateProvider({ children }: { children: ReactNode }) {
  const [states, setStates] = useState<SoundStates>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    // Favourites from before the redesign are folded in first, so a returning user's
    // saved list is already correct by the time anything reads it.
    migrateFavourites()
      .then(() => getSoundStates())
      .then((stored) => {
        if (!active) return;
        setStates(stored);
        setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const stateFor = useCallback(
    (id: string) => ({ ...DEFAULT_SOUND_STATE, ...states[id] }),
    [states]
  );

  /** Toggles whose write has not landed yet. Read by `refresh` — see below. */
  const writing = useRef(0);

  const toggleSaved = useCallback(async (id: string) => {
    // Flipped in memory first so the star answers the tap rather than the disk. The store
    // derives the same flip from the same stored value, so the two agree.
    setStates((current) => ({
      ...current,
      [id]: { ...DEFAULT_SOUND_STATE, ...current[id], saved: !current[id]?.saved },
    }));
    writing.current += 1;
    try {
      await persistSaved(id);
    } finally {
      writing.current -= 1;
    }
  }, []);

  const refresh = useCallback(async () => {
    const stored = await getSoundStates();
    // A star tapped while this read was in the air is not in what came back, and the tap
    // is the newer truth of the two — so the read is dropped rather than allowed to undo
    // it. Whatever it would have brought arrives on the next focus instead.
    if (writing.current > 0) return;
    setStates(stored);
  }, []);

  const value = useMemo<SoundStateContextValue>(
    () => ({ states, ready, stateFor, toggleSaved, refresh }),
    [states, ready, stateFor, toggleSaved, refresh]
  );

  return <SoundStateContext.Provider value={value}>{children}</SoundStateContext.Provider>;
}

/**
 * Throws outside a provider rather than falling back to empty state: a screen that
 * silently failed to save would look like it worked and lose the tap.
 */
export function useSoundStates(): SoundStateContextValue {
  const value = useContext(SoundStateContext);
  if (!value) {
    throw new Error('useSoundStates must be used inside a SoundStateProvider');
  }
  return value;
}

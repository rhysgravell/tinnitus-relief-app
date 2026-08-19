import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useSettings } from './SettingsContext';
import { useCountdownClock } from '../hooks/useCountdownClock';
import { useSessionAudio } from '../hooks/useSessionAudio';
import { useSessionSetup } from '../hooks/useSessionSetup';
import { addSession } from '../store/sessions';
import { DEFAULT_SETTINGS } from '../store/settings';
import { recordSession } from '../store/soundState';
import { findSound, isPlayable } from '../store/sounds';
import type { Sound } from '../store/sounds';
import { wholeMinutes } from '../utils/duration';

/**
 * Swallows a failed write. Both of these run as the sound is let go, with nothing on screen
 * left to tell, and one entry missing from the log is a smaller loss than a rejection
 * nobody is listening for.
 */
function ignoreFailure() {}

/**
 * Below this, nothing is recorded. Opening a session and closing it again is not a
 * session, and remembering it would push a real one off the resume card.
 */
const MINIMUM_RECORDED_SECONDS = 30;

type PlaybackContextValue = {
  /** What is loaded, or null when nothing is. */
  sound: Sound | null;
  /** Whether the transport is running. See `silent` for whether anything is audible. */
  playing: boolean;
  /** True when the loaded sound has no recording, or the player could not be made. */
  silent: boolean;
  /** False until this sound's remembered volume and timer have been read. */
  ready: boolean;
  /** 0–1. */
  volume: number;
  setVolume: (value: number) => void;
  /** Minutes, or null for the ∞ timer. */
  timerMinutes: number | null;
  setTimerMinutes: (minutes: number | null) => void;
  elapsedSeconds: number;
  remainingSeconds: number | null;
  /** Loads a sound and starts it. Asking for the one already loaded leaves it running. */
  open: (soundId: string) => void;
  /** Play or pause. Play after a timer has run out starts a fresh stretch. */
  toggle: () => void;
  /** Ends the session: writes it to the log and releases the player. */
  stop: () => void;
};

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

/**
 * The one sound the app plays, owned above the navigator rather than by the screen that
 * starts it.
 *
 * It lives here because the wind-down routine says it does: step three of it is "Slow
 * breathing · 4 min — guided, with your sound still playing underneath", and the breathing
 * screen repeats the promise. Both were false while the player belonged to the session
 * sheet, which released it the moment the moon handed the night over to Sleep.
 *
 * Leaving the session still ends it — the sheet's chevron and a swipe down both stop the
 * sound. The moon is the single exception, and the Session screen is what says so.
 */
export function PlaybackProvider({ children }: { children: ReactNode }) {
  const [soundId, setSoundId] = useState<string | null>(null);

  const open = useCallback((id: string) => setSoundId(id), []);
  const stop = useCallback(() => setSoundId(null), []);

  return (
    /*
     * Keyed on the sound, so opening a different one is a new session rather than the old
     * one with the artwork changed: the clock, the chosen volume and the chosen timer all
     * belong to the sound they were set for, and a key is how React is told to let them go.
     * Unmounting is also what writes the finished session to the log.
     */
    <LoadedSound key={soundId ?? 'nothing'} soundId={soundId} open={open} stop={stop}>
      {children}
    </LoadedSound>
  );
}

type LoadedProps = {
  soundId: string | null;
  open: (soundId: string) => void;
  stop: () => void;
  children: ReactNode;
};

function LoadedSound({ soundId, open, stop, children }: LoadedProps) {
  const { settings } = useSettings();
  const sound = (soundId ? findSound(soundId) : undefined) ?? null;
  /** One sound in the catalogue is still waiting on its recording. */
  const playable = sound !== null && isPlayable(sound);

  const [playing, setPlaying] = useState(true);

  const {
    volume,
    setVolume,
    timerMinutes,
    setTimerMinutes,
    ready: seeded,
  } = useSessionSetup(sound?.id, settings);

  /**
   * Whether the sound is actually going. Held until the remembered setup lands, so the
   * clock and the sound start together. Held for a sound with no recording too, which is
   * also what keeps it out of the history: the guard below reads a clock that never left
   * zero.
   */
  const running = playing && seeded && playable;

  const { elapsedSeconds, remainingSeconds, restart } = useCountdownClock({
    running,
    timerMinutes,
    // Stopping rather than tearing the session down: whoever set a timer is probably
    // asleep, and a screen that vanished on its own would leave them with no idea what
    // happened.
    onExpire: () => setPlaying(false),
  });

  const { silent } = useSessionAudio({
    source: seeded ? (sound?.file ?? null) : null,
    playing,
    volume,
    remainingSeconds,
    fadeOut: settings?.fadeOut ?? DEFAULT_SETTINGS.fadeOut,
    mixWithOthers: settings?.mixWithOthers ?? DEFAULT_SETTINGS.mixWithOthers,
  });

  /** The clock reading already written to the log, so one stretch is only recorded once. */
  const recordedAtRef = useRef<number | null>(null);

  const toggle = useCallback(() => {
    // Play after the timer has run out starts another stretch of the same length rather
    // than resuming a session with nothing left on it — which would be silent, since the
    // fade has already taken the volume to zero.
    if (!playing && remainingSeconds === 0) {
      restart();
      // The stretch that just ended is already in the log; what follows is its own entry,
      // even if it runs to exactly the same length.
      recordedAtRef.current = null;
    }
    setPlaying((current) => !current);
  }, [playing, remainingSeconds, restart]);

  /** The values as they stood at the end. Declared first so the effects below read them. */
  const finalRef = useRef({ elapsedSeconds, volume, timerMinutes });
  useEffect(() => {
    finalRef.current = { elapsedSeconds, volume, timerMinutes };
  }, [elapsedSeconds, volume, timerMinutes]);

  /**
   * When the sound stopped, or null while it is still going.
   *
   * A timer that runs out at eleven and a session ended the next morning are eight hours
   * apart, and it is the first of the two the session happened at. Dating it from the
   * second would file it under the following night — so the check-in it belongs beside
   * would not see it — and have the resume card call it "Earlier today".
   */
  const stoppedAtRef = useRef<number | null>(null);
  useEffect(() => {
    if (!running) return;
    stoppedAtRef.current = null;
    return () => {
      stoppedAtRef.current = Date.now();
    };
  }, [running]);

  const remember = useCallback(() => {
    const id = sound?.id;
    const { elapsedSeconds: elapsed, volume: level, timerMinutes: timer } = finalRef.current;
    if (!id || elapsed < MINIMUM_RECORDED_SECONDS || elapsed === recordedAtRef.current) return;

    recordedAtRef.current = elapsed;
    void recordSession(id, { volume: level, timerMinutes: timer }).catch(ignoreFailure);
    void addSession({
      soundId: id,
      endedAt: new Date(stoppedAtRef.current ?? Date.now()).toISOString(),
      durationMinutes: wholeMinutes(elapsed),
      timerMinutes: timer,
    }).catch(ignoreFailure);
  }, [sound?.id]);

  useEffect(() => {
    // A timer running out is the end of the session, so it goes in the log then and there.
    // Waiting for the session to be ended would lose the whole night if the system
    // reclaimed an app that had been playing in the background since eleven.
    if (remainingSeconds !== 0) return;
    remember();
  }, [remainingSeconds, remember]);

  useEffect(() => {
    // And when the sound is let go, which is the only ending a session with no timer has:
    // stopped, swapped for another sound, or the app itself going away.
    return () => remember();
  }, [remember]);

  const value = useMemo<PlaybackContextValue>(
    () => ({
      sound,
      playing,
      silent,
      ready: seeded,
      volume,
      setVolume,
      timerMinutes,
      setTimerMinutes,
      elapsedSeconds,
      remainingSeconds,
      open,
      toggle,
      stop,
    }),
    [
      sound,
      playing,
      silent,
      seeded,
      volume,
      setVolume,
      timerMinutes,
      setTimerMinutes,
      elapsedSeconds,
      remainingSeconds,
      open,
      toggle,
      stop,
    ]
  );

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}

/**
 * Throws outside a provider rather than handing back a dead transport: a play button that
 * silently did nothing would look like a broken sound file.
 */
export function usePlayback(): PlaybackContextValue {
  const value = useContext(PlaybackContext);
  if (!value) {
    throw new Error('usePlayback must be used inside a PlaybackProvider');
  }
  return value;
}

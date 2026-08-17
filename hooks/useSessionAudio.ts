import { useEffect, useState } from 'react';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer, AudioSource } from 'expo-audio';

/** How long the fade at the end of a timed session takes. */
export const FADE_SECONDS = 30;

type Options = {
  /** The recording to loop. Null for a sound whose recording has not shipped yet. */
  source: AudioSource | null;
  /** Playing or paused. */
  playing: boolean;
  /** The level the user has chosen, 0–1. */
  volume: number;
  /** Seconds left on the timer, or null on the ∞ timer. Only used to drive the fade. */
  remainingSeconds: number | null;
  /** The "Fade out" setting — ease the sound away rather than cutting it off. */
  fadeOut: boolean;
  /** The "Play over other apps" setting. */
  mixWithOthers: boolean;
};

type SessionAudio = {
  /** True when there is nothing to play, or the player could not be created. */
  silent: boolean;
};

/**
 * How much of the chosen volume is actually coming out right now. Exported for its own
 * test: a fade that starts at the wrong moment is not something you can hear in a unit.
 */
export function fadeMultiplier(remainingSeconds: number | null, fadeOut: boolean): number {
  if (!fadeOut || remainingSeconds === null || remainingSeconds >= FADE_SECONDS) return 1;
  return Math.max(0, remainingSeconds) / FADE_SECONDS;
}

/**
 * The session's single looping player. Declarative on purpose — the screen owns whether the
 * sound is playing and how loud, and this reconciles the player to match, so there is no
 * second copy of that state to fall out of step with the transport button.
 *
 * One player, never two: this app plays one sound at a time by design, and layering is
 * exactly what the old mixer did badly.
 */
export function useSessionAudio({
  source,
  playing,
  volume,
  remainingSeconds,
  fadeOut,
  mixWithOthers,
}: Options): SessionAudio {
  const [player, setPlayer] = useState<AudioPlayer | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Only once there is something to play. This hook now lives above the navigator, for
    // the whole life of the app, and claiming the audio session at launch would interrupt
    // whatever the phone was already playing before the user had asked for anything.
    if (source === null) return;

    // A masking sound is useless if it stops when the screen locks, and useless on a phone
    // left on silent overnight.
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: mixWithOthers ? 'mixWithOthers' : 'duckOthers',
    }).catch(() => {
      // Playback still works with the default mode; it just may not survive a lock.
    });
  }, [mixWithOthers, source]);

  useEffect(() => {
    if (source === null) return;

    let created: AudioPlayer;
    try {
      created = createAudioPlayer(source);
    } catch {
      // A missing or unreadable asset. The screen says so rather than pretending to play.
      setFailed(true);
      return;
    }

    created.loop = true;
    setFailed(false);
    setPlayer(created);

    return () => {
      setPlayer(null);
      created.remove();
    };
  }, [source]);

  // Declared before the transport effect so a new player takes its level before it is
  // told to play — otherwise the first moment of a session comes out at full volume.
  useEffect(() => {
    if (!player) return;
    // eslint-disable-next-line react-hooks/immutability -- an AudioPlayer is a native handle held in state for its identity, not React data; assigning `volume` is expo-audio's documented API and there is no setter method
    player.volume = volume * fadeMultiplier(remainingSeconds, fadeOut);
  }, [player, volume, remainingSeconds, fadeOut]);

  useEffect(() => {
    if (!player) return;
    if (playing) {
      player.play();
    } else {
      player.pause();
    }
  }, [player, playing]);

  return { silent: source === null || failed };
}

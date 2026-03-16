import { useEffect, useRef, useState } from 'react';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';

export type Soundscape = {
  id: string;
  title: string;
  description: string;
  file: ReturnType<typeof require>;
};

export function useAudioPlayer() {
  const playerRef = useRef<AudioPlayer | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    });
    return () => {
      playerRef.current?.remove();
    };
  }, []);

  async function play(soundscape: Soundscape) {
    setLoadingId(soundscape.id);
    setErrorId(null);
    try {
      playerRef.current?.remove();
      playerRef.current = null;

      const player = createAudioPlayer(soundscape.file);
      player.loop = true;
      player.play();
      playerRef.current = player;
      setPlayingId(soundscape.id);
    } catch {
      setErrorId(soundscape.id);
      setPlayingId(null);
    } finally {
      setLoadingId(null);
    }
  }

  function stop() {
    playerRef.current?.remove();
    playerRef.current = null;
    setPlayingId(null);
    setErrorId(null);
  }

  async function toggle(soundscape: Soundscape) {
    if (playingId === soundscape.id) {
      stop();
    } else {
      await play(soundscape);
    }
  }

  return { playingId, loadingId, errorId, toggle, stop };
}

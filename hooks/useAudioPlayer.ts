import { useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

export type Soundscape = {
  id: string;
  title: string;
  description: string;
  file: ReturnType<typeof require>;
};

export function useAudioPlayer() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    });
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  async function play(soundscape: Soundscape) {
    setIsLoading(true);
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(soundscape.file, {
        isLooping: true,
        shouldPlay: true,
      });
      soundRef.current = sound;
      setPlayingId(soundscape.id);
    } finally {
      setIsLoading(false);
    }
  }

  async function stop() {
    await soundRef.current?.stopAsync();
    await soundRef.current?.unloadAsync();
    soundRef.current = null;
    setPlayingId(null);
  }

  async function toggle(soundscape: Soundscape) {
    if (playingId === soundscape.id) {
      await stop();
    } else {
      await play(soundscape);
    }
  }

  return { playingId, isLoading, toggle, stop };
}

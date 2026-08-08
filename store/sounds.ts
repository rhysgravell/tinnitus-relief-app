/** The filter row on the Sounds screen offers All plus one chip per category. */
export type SoundCategory = 'rain' | 'nature' | 'noise';

export type Sound = {
  id: string;
  name: string;
  /**
   * How the sound behaves rather than what it depicts — "Broadband · soft". When you are
   * choosing something to mask a tone, this matters more than the genre does.
   */
  descriptor: string;
  category: SoundCategory;
  artwork: ReturnType<typeof require>;
  /**
   * Null while the recording is still outstanding. Such a sound is listed but cannot be
   * played, so every consumer has to decide what to do about that rather than crash.
   */
  file: ReturnType<typeof require> | null;
};

/* eslint-disable @typescript-eslint/no-require-imports -- Metro needs literal require() calls to resolve static assets */
export const SOUNDS: Sound[] = [
  {
    id: 'rain-on-canvas',
    name: 'Rain on canvas',
    descriptor: 'Broadband · soft',
    category: 'rain',
    artwork: require('../assets/artwork/rain-on-canvas.jpg'),
    file: null,
  },
  {
    id: 'fire-and-rain',
    name: 'Fire and Rain',
    descriptor: 'Crackle · warm',
    category: 'rain',
    artwork: require('../assets/artwork/fire-and-rain.jpg'),
    file: require('../assets/sounds/fire-and-rain.wav'),
  },
  {
    id: 'underwater',
    name: 'Underwater',
    descriptor: 'Low-pass · deep',
    category: 'noise',
    artwork: require('../assets/artwork/underwater.jpg'),
    file: require('../assets/sounds/underwater.wav'),
  },
  {
    id: 'at-the-beach',
    name: 'At the Beach',
    descriptor: 'Surf · rhythmic',
    category: 'nature',
    artwork: require('../assets/artwork/at-the-beach.jpg'),
    file: require('../assets/sounds/at-the-beach.wav'),
  },
  {
    id: 'evening-forest',
    name: 'Evening Forest',
    descriptor: 'High-band · sparse',
    category: 'nature',
    artwork: require('../assets/artwork/evening-forest.jpg'),
    file: require('../assets/sounds/evening-forest.wav'),
  },
];
/* eslint-enable @typescript-eslint/no-require-imports */

export function findSound(id: string): Sound | undefined {
  return SOUNDS.find((sound) => sound.id === id);
}

export function soundsInCategory(category: SoundCategory | 'all'): Sound[] {
  return category === 'all' ? SOUNDS : SOUNDS.filter((s) => s.category === category);
}

/** A sound can only start a session once its recording has shipped. */
export function isPlayable(sound: Sound): boolean {
  return sound.file !== null;
}

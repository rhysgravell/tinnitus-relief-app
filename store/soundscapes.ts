import { Soundscape } from '../hooks/useAudioPlayer';

/* eslint-disable @typescript-eslint/no-require-imports -- Metro needs literal require() calls to resolve static assets */
export const SOUNDSCAPES: Soundscape[] = [
  {
    id: 'fire-and-rain',
    title: 'Fire and Rain',
    description: 'Crackling fire under steady rainfall',
    file: require('../assets/sounds/fire-and-rain.wav'),
  },
  {
    id: 'underwater',
    title: 'Underwater',
    description: 'Muffled, deep ocean ambience',
    file: require('../assets/sounds/underwater.wav'),
  },
  {
    id: 'at-the-beach',
    title: 'At the Beach',
    description: 'Waves rolling onto the shore',
    file: require('../assets/sounds/at-the-beach.wav'),
  },
  {
    id: 'peaceful-morning',
    title: 'Peaceful Morning',
    description: 'Birdsong and a gentle breeze',
    file: require('../assets/sounds/peaceful-morning.wav'),
  },
  {
    id: 'evening-forest',
    title: 'Evening Forest',
    description: 'Crickets and rustling leaves at dusk',
    file: require('../assets/sounds/evening-forest.wav'),
  },
];

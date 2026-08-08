import { DMMono_400Regular } from '@expo-google-fonts/dm-mono';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import { Newsreader_400Regular } from '@expo-google-fonts/newsreader';

/**
 * The fonts loaded at startup. Each key becomes the family name React Native
 * registers, so these keys must match the values in `FONT` in `./tokens`.
 *
 * The design pairs a soft serif display face with a neutral sans for UI and a mono
 * for readouts and section labels.
 */
export const FONT_ASSETS = {
  Newsreader_400Regular,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMMono_400Regular,
} as const;

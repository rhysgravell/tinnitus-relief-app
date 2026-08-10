import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Card } from './Card';
import { SavedStar } from './SavedStar';
import { Text } from './Text';
import { useTheme } from '../theme/ThemeProvider';
import { SPACE } from '../theme/tokens';
import { isPlayable } from '../store/sounds';
import type { Sound } from '../store/sounds';

/** The artwork strip's height. The card's own width comes from the grid. */
const ARTWORK_HEIGHT = 82;

type Props = {
  sound: Sound;
  saved: boolean;
  onPress: () => void;
  onToggleSaved: () => void;
};

/**
 * A sound in the grid on Sounds: artwork, a saved star over it, then the name and the
 * sonic descriptor. The descriptor is what the design leads on rather than a genre, since
 * how a sound behaves is what matters when you are choosing something to mask a tone.
 */
export function SoundCard({ sound, saved, onPress, onToggleSaved }: Props) {
  const { colors } = useTheme();
  // A sound whose recording has not shipped yet is shown but inert: hiding it would leave
  // the catalogue looking shorter than it is, and playing it would fail.
  const available = isPlayable(sound);

  return (
    <Pressable
      // Both the card and the star it contains are buttons, so each carries an id: an
      // accessible name is not enough to tell them apart from the outside.
      testID={`sound-card-${sound.id}`}
      onPress={onPress}
      disabled={!available}
      accessibilityRole="button"
      accessibilityState={{ disabled: !available }}
      accessibilityLabel={sound.name}
      style={({ pressed }) => [pressed && styles.pressed, !available && styles.unavailable]}
    >
      <Card padding={0} clip>
        <View style={[styles.artwork, { backgroundColor: colors.track }]}>
          <Image
            source={sound.artwork}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            accessible={false}
          />
          <View testID={`saved-star-slot-${sound.id}`} style={styles.star}>
            <SavedStar
              testID={`saved-star-${sound.id}`}
              saved={saved}
              soundName={sound.name}
              onPress={onToggleSaved}
              disabled={!available}
            />
          </View>
        </View>
        <View style={styles.body}>
          <Text variant="cardTitleSmall" numberOfLines={1}>
            {sound.name}
          </Text>
          <Text variant="meta" tone="faint" style={styles.descriptor} numberOfLines={1}>
            {available ? sound.descriptor : 'Coming soon'}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  artwork: {
    height: ARTWORK_HEIGHT,
    position: 'relative',
  },
  star: {
    position: 'absolute',
    top: SPACE.s8,
    right: SPACE.s8,
    // Above the artwork, which fills the strip absolutely.
    zIndex: 2,
  },
  // The design's padding is tighter at the top than the bottom, which keeps the two lines
  // of text sitting visually centred in the block.
  body: {
    paddingTop: 11,
    paddingHorizontal: SPACE.s12,
    paddingBottom: 13,
  },
  descriptor: {
    marginTop: SPACE.s2,
  },
  pressed: {
    opacity: 0.85,
  },
  unavailable: {
    opacity: 0.5,
  },
});

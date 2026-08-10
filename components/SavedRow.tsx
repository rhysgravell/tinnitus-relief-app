import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Card } from './Card';
import { PlayTriangle } from './PlayTriangle';
import { Text } from './Text';
import { useTheme } from '../theme/ThemeProvider';
import { LAYOUT, RADIUS, SPACE } from '../theme/tokens';
import { isPlayable } from '../store/sounds';
import type { Sound } from '../store/sounds';

const THUMBNAIL = 56;
const PLAY_SIZE = 42;

type Props = {
  sound: Sound;
  /** The context line — plays and timer. Composed by `savedMeta`. */
  meta: string;
  onPress: () => void;
};

/**
 * A saved sound, as a row rather than a grid card: the grid on Sounds is for browsing by
 * artwork, whereas by the time a sound is saved the user knows it by name and wants the
 * shortest possible path into it.
 *
 * The whole row is the target, as on the resume card — the circle says what the row does,
 * but it would be a small thing to have to aim at.
 */
export function SavedRow({ sound, meta, onPress }: Props) {
  const { colors } = useTheme();
  // A sound whose recording has not shipped stays in the list — it is saved, and hiding it
  // would look like the star had been lost — but there is nothing to play.
  const available = isPlayable(sound);

  return (
    <Pressable
      testID={`saved-row-${sound.id}`}
      onPress={onPress}
      disabled={!available}
      accessibilityRole="button"
      accessibilityState={{ disabled: !available }}
      accessibilityLabel={sound.name}
      accessibilityHint={meta}
      style={({ pressed }) => [pressed && styles.pressed, !available && styles.unavailable]}
    >
      <Card padding={0} style={styles.row}>
        <Image
          source={sound.artwork}
          style={[styles.thumbnail, { backgroundColor: colors.track }]}
          resizeMode="cover"
          accessible={false}
        />
        <View style={styles.details}>
          <Text variant="rowTitle" numberOfLines={1}>
            {sound.name}
          </Text>
          <Text variant="meta" tone="faint" style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        </View>
        <View style={[styles.play, { borderColor: colors.borderStrong }]}>
          <PlayTriangle />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.s14,
    // 13 rather than the scale's 14: the design tightens the vertical inset so the row
    // lands on 84pt with the 56pt thumbnail inside it.
    paddingVertical: 13,
    paddingHorizontal: SPACE.s14,
  },
  thumbnail: {
    width: THUMBNAIL,
    height: THUMBNAIL,
    borderRadius: RADIUS.thumbnail,
    flexShrink: 0,
  },
  details: {
    flex: 1,
    // Lets the name truncate rather than push the play circle off the row.
    minWidth: 0,
  },
  meta: {
    marginTop: SPACE.s3,
  },
  play: {
    width: PLAY_SIZE,
    height: PLAY_SIZE,
    borderRadius: PLAY_SIZE / 2,
    borderWidth: LAYOUT.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pressed: {
    opacity: 0.85,
  },
  unavailable: {
    opacity: 0.5,
  },
});

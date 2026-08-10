import { Pressable, StyleSheet, View } from 'react-native';
import { PlayTriangle } from './PlayTriangle';
import { useTheme } from '../theme/ThemeProvider';
import { SPACE } from '../theme/tokens';

const SIZE = 74;
const BAR_WIDTH = 6;
const BAR_HEIGHT = 26;

type Props = {
  playing: boolean;
  onPress: () => void;
  disabled?: boolean;
};

/**
 * Play and pause, as one 74pt circle. The largest target on the screen by a wide margin,
 * because it is the only control anyone reaches for in the dark.
 *
 * The fill is the palette's text colour and the glyph its background — inverted against
 * everything around it, which is what makes it the obvious thing to press.
 */
export function TransportButton({ playing, onPress, disabled = false }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      testID="transport-button"
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={playing ? 'Pause' : 'Play'}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.text },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {playing ? (
        <View style={styles.bars}>
          {/* Two rounded bars rather than a glyph, so the pause matches the play triangle's
              weight exactly. */}
          <View style={[styles.bar, { backgroundColor: colors.background }]} />
          <View style={[styles.bar, { backgroundColor: colors.background }]} />
        </View>
      ) : (
        <PlayTriangle size={16} color={colors.background} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bars: {
    flexDirection: 'row',
    gap: 7,
  },
  bar: {
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: SPACE.s2,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.4,
  },
});

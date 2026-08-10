import { Pressable, StyleSheet, Text as RNText } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { LAYOUT, OVERLAY } from '../theme/tokens';

const SIZE = 28;

type Props = {
  saved: boolean;
  /** Named in the label, since a star on its own tells assistive tech nothing. */
  soundName: string;
  onPress: () => void;
  /**
   * `chip` sits on a sound's artwork and brings its own translucent backing. `bare` sits
   * on a screen surface, where a white chip would be a hole in the design.
   */
  variant?: 'chip' | 'bare';
  disabled?: boolean;
  testID?: string;
};

/**
 * The star that saves a sound. On artwork its colours come from `OVERLAY` rather than the
 * palette, because it sits on a photograph that does not change with the scheme; on a
 * surface it takes the palette like everything else.
 */
export function SavedStar({
  saved,
  soundName,
  onPress,
  variant = 'chip',
  disabled = false,
  testID,
}: Props) {
  const { colors } = useTheme();
  const bare = variant === 'bare';

  const color = bare
    ? saved
      ? colors.primary
      : colors.textMuted
    : saved
      ? OVERLAY.starSaved
      : OVERLAY.starIdle;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: saved, disabled }}
      accessibilityLabel={saved ? `Remove ${soundName} from saved` : `Save ${soundName}`}
      // 28pt visually, grown to clear the 44pt minimum.
      hitSlop={(LAYOUT.minTouchTarget - SIZE) / 2}
      style={({ pressed }) => [
        styles.base,
        bare ? styles.bare : styles.chip,
        pressed && styles.pressed,
      ]}
    >
      {/* A text character rather than an icon: this design ships no icon library, and the
          filled and hollow stars are a single glyph swap. */}
      <RNText style={[bare ? styles.bareStar : styles.star, { color }]}>{saved ? '★' : '☆'}</RNText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    borderRadius: SIZE / 2,
    backgroundColor: OVERLAY.chip,
  },
  bare: {
    backgroundColor: 'transparent',
  },
  star: {
    fontSize: 14,
    // Matched to the font size so the glyph sits on the chip's centre line rather than on
    // the taller default leading.
    lineHeight: 14,
  },
  /** Larger without the chip to constrain it, as the design draws it on Session. */
  bareStar: {
    fontSize: 20,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.7,
  },
});

import { Pressable, StyleSheet, Text as RNText } from 'react-native';
import { LAYOUT, OVERLAY } from '../theme/tokens';

const SIZE = 28;

type Props = {
  saved: boolean;
  /** Named in the label, since a star on its own tells assistive tech nothing. */
  soundName: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
};

/**
 * The star that sits on a sound's artwork. Its colours come from `OVERLAY` rather than the
 * palette because it sits on a photograph, not on a surface.
 */
export function SavedStar({ saved, soundName, onPress, disabled = false, testID }: Props) {
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
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
    >
      {/* A text character rather than an icon: this design ships no icon library, and the
          filled and hollow stars are a single glyph swap. */}
      <RNText style={[styles.star, { color: saved ? OVERLAY.starSaved : OVERLAY.starIdle }]}>
        {saved ? '★' : '☆'}
      </RNText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: OVERLAY.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    fontSize: 14,
    // Matched to the font size so the glyph sits on the chip's centre line rather than on
    // the taller default leading.
    lineHeight: 14,
  },
  pressed: {
    opacity: 0.7,
  },
});

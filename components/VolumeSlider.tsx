import Slider from '@react-native-community/slider';
import { StyleSheet, Text as RNText, View } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme/ThemeProvider';
import { SPACE } from '../theme/tokens';

const QUIET_DOT = 8;
const GLYPH_COLUMN = 20;

type Props = {
  /** 0–1. */
  value: number;
  /** Fires continuously as the thumb moves, so the sound follows the finger. */
  onChange: (value: number) => void;
  /** Guidance under the track. The advice differs by screen, so the copy is passed in. */
  hint?: string;
};

/**
 * The session's one control: how loud. A slider with a quiet end and a loud end, and no
 * numbers — the right level is the one that sits under the ringing, not a percentage.
 */
export function VolumeSlider({ value, onChange, hint }: Props) {
  const { colors } = useTheme();

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.glyph}>
          {/* The quiet end. A small circle rather than a speaker icon: this design ships
              no icon library, and the pair reads as a scale on its own. */}
          <View
            style={[
              styles.quietDot,
              { backgroundColor: colors.textMuted },
            ]}
          />
        </View>
        <Slider
          testID="volume-slider"
          style={styles.slider}
          accessibilityLabel="Volume"
          value={value}
          onValueChange={onChange}
          minimumValue={0}
          maximumValue={1}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.track}
          // The near-white of the palette's text, which is what the design uses — the thumb
          // is the brightest thing in the row.
          thumbTintColor={colors.text}
        />
        <RNText style={[styles.loudGlyph, { color: colors.textMuted }]}>◉</RNText>
      </View>
      {hint ? (
        <Text variant="meta" tone="faint" style={styles.hint}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.s14,
  },
  glyph: {
    width: GLYPH_COLUMN,
    alignItems: 'center',
  },
  quietDot: {
    width: QUIET_DOT,
    height: QUIET_DOT,
    borderRadius: QUIET_DOT / 2,
  },
  slider: {
    flex: 1,
  },
  loudGlyph: {
    width: GLYPH_COLUMN,
    fontSize: 17,
    textAlign: 'right',
  },
  hint: {
    marginTop: SPACE.s12,
    textAlign: 'center',
  },
});

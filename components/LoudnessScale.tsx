import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme/ThemeProvider';
import { LOUDNESS_HEIGHTS, SPACE } from '../theme/tokens';
import { LOUDNESS_ENDS, LOUDNESS_LEVELS } from '../store/checkIns';
import type { Loudness } from '../store/checkIns';

/** The height of the row the bars stand in. */
const SCALE_HEIGHT = 56;

type Props = {
  value: Loudness | null;
  onChange: (value: Loudness) => void;
};

/**
 * How loud it was, on five rising bars.
 *
 * A row of bars rather than a slider: a slider invites precision the answer does not have,
 * and its thumb has to be dragged. Five taps, and the shape of the row says which end is
 * which before the labels underneath are read.
 */
export function LoudnessScale({ value, onChange }: Props) {
  const { colors } = useTheme();

  return (
    <View>
      <View style={styles.bars}>
        {LOUDNESS_LEVELS.map((level) => (
          <Pressable
            key={level}
            onPress={() => onChange(level)}
            accessibilityRole="button"
            accessibilityState={{ selected: value === level }}
            accessibilityLabel={`Level ${level} of ${LOUDNESS_LEVELS.length}`}
            // The bar itself is 13 to 49pt tall, so the target is the full-height column it
            // sits at the bottom of. That clears 44pt without a hitSlop overlapping its
            // neighbours, which would make the short bars unpickable.
            style={styles.column}
          >
            <View
              testID={`loudness-bar-${level}`}
              style={[
                styles.bar,
                {
                  height: `${LOUDNESS_HEIGHTS[level - 1]}%`,
                  backgroundColor: value === level ? colors.primary : colors.barIdle,
                },
              ]}
            />
          </Pressable>
        ))}
      </View>
      <View style={styles.ends}>
        <Text variant="meta" tone="subtle">
          {LOUDNESS_ENDS.low}
        </Text>
        <Text variant="meta" tone="subtle">
          {LOUDNESS_ENDS.high}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: SCALE_HEIGHT,
    gap: SPACE.s6,
  },
  column: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    // Squarer at the foot than at the head, as the design draws them — the bars grow up
    // out of a baseline rather than floating.
    borderTopLeftRadius: SPACE.s6,
    borderTopRightRadius: SPACE.s6,
    borderBottomLeftRadius: SPACE.s3,
    borderBottomRightRadius: SPACE.s3,
  },
  ends: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACE.s10,
  },
});

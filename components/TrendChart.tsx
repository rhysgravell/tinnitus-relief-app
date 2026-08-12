import { StyleSheet, View } from 'react-native';
import { CHART_RAMP, LOUDNESS_HEIGHTS, SPACE } from '../theme/tokens';
import { chartLabel, TREND_DAYS } from '../store/trend';
import type { TrendDay } from '../store/trend';

/** The height of the plot. */
const CHART_HEIGHT = 76;

/** The gap between columns, which closes up as the window widens. */
const GAP = 5;
const GAP_WIDE = SPACE.s3;

type Props = {
  days: TrendDay[];
  testID?: string;
};

/**
 * Loudness per day, oldest on the left. Every day in the window gets a column whether it
 * was logged or not, so a run of missed days reads as the gap it was.
 *
 * Colour carries recency rather than value — the bars darken towards today, which is what
 * makes the direction legible without axes or a legend.
 */
export function TrendChart({ days, testID }: Props) {
  return (
    <View
      testID={testID}
      accessibilityRole="image"
      accessibilityLabel={chartLabel(days)}
      style={[styles.chart, { gap: days.length > TREND_DAYS ? GAP_WIDE : GAP }]}
    >
      {days.map(({ date, entry }, index) => (
        <View key={date} style={styles.column}>
          {entry ? (
            <View
              testID={`trend-bar-${date}`}
              style={[
                styles.bar,
                {
                  height: `${LOUDNESS_HEIGHTS[entry.loudness - 1]}%`,
                  backgroundColor: CHART_RAMP[rampIndex(index, days.length)],
                },
              ]}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

/**
 * Which shade a column takes: oldest to newest in equal bands, so today always lands in the
 * darkest one. Exported for the test, which reads the fills back off the bars.
 */
export function rampIndex(index: number, count: number): number {
  if (count <= 1) return CHART_RAMP.length - 1;
  const band = Math.floor((index / count) * CHART_RAMP.length);
  return Math.min(band, CHART_RAMP.length - 1);
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
  },
  column: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    // Even corners here, unlike the loudness scale: these are read as a series rather than
    // tapped, so they do not need a foot.
    borderRadius: SPACE.s4,
  },
});

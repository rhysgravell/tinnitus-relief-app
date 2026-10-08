import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import { Text } from './Text';
import { useTheme } from '../theme/ThemeProvider';
import { LAYOUT, SPACE } from '../theme/tokens';
import { stepDetail } from '../store/routine';
import type { RoutineStep as Step } from '../store/routine';

const NUMERAL_SIZE = 28;

type Props = {
  step: Step;
  /** 1-based, as shown. Passed in rather than derived so the list stays the one source. */
  position: number;
  /** Omitted on the last step, where a line would read as a missing sixth row. */
  divider?: boolean;
  /** The step's control, for the one step that has something to press. */
  action?: ReactNode;
  /**
   * Whether a sound is playing, for the one step whose detail can say so. Defaults to no,
   * which is the reading that holds on any night — the promise of a sound underneath has to
   * be asked for.
   */
  soundPlaying?: boolean;
};

/**
 * One step of the wind-down routine: its number, what to do, and why.
 *
 * Numerals rather than the old emoji, because this is a sequence and a numeral says so —
 * five unrelated pictograms did not.
 */
export function RoutineStep({
  step,
  position,
  divider = true,
  action,
  soundPlaying = false,
}: Props) {
  const { colors } = useTheme();

  return (
    <View
      testID={`routine-step-${step.id}`}
      style={[
        styles.row,
        // Centred only when there is a control to line the number up with; otherwise the
        // number sits with the first line of text.
        action ? styles.rowWithAction : null,
        divider ? { borderBottomColor: colors.hairline, borderBottomWidth: LAYOUT.hairlineWidth } : null,
      ]}
    >
      <View style={[styles.numeral, { borderColor: colors.borderStrong }]}>
        <Text variant="monoCaption" tone="primary" style={styles.numeralText}>
          {String(position)}
        </Text>
      </View>
      <View style={styles.body}>
        {/* Only the breathing step carries a spoken title; the rest are whole words already,
            and undefined leaves the reader with the text on screen. */}
        <Text variant="rowTitle" accessibilityLabel={step.spokenTitle}>
          {step.title}
        </Text>
        <Text variant="bodySecondary" tone="muted" style={styles.detail}>
          {stepDetail(step, soundPlaying)}
        </Text>
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.s16,
    paddingVertical: 15,
  },
  rowWithAction: {
    alignItems: 'center',
  },
  numeral: {
    width: NUMERAL_SIZE,
    height: NUMERAL_SIZE,
    borderRadius: NUMERAL_SIZE / 2,
    borderWidth: LAYOUT.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  numeralText: {
    // The mono role carries tracking, which pushes a single digit off centre inside a
    // circle. There is no next character for it to space against.
    letterSpacing: 0,
  },
  body: {
    flex: 1,
  },
  detail: {
    marginTop: SPACE.s3,
  },
});

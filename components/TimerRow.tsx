import { StyleSheet, View } from 'react-native';
import { Pill } from './Pill';
import { SPACE } from '../theme/tokens';
import { TIMER_OPTIONS, timerAccessibilityLabel, timerLabel } from '../store/settings';

type Props = {
  /** The selected length in minutes, or null for ∞. */
  value: number | null;
  onChange: (minutes: number | null) => void;
};

/**
 * The session's timer: five pills sharing the width. A row rather than a picker because
 * this is a thing you set at 1am — every option is one tap, and none of them is hidden
 * behind a sheet.
 */
export function TimerRow({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {TIMER_OPTIONS.map((minutes) => (
        <Pill
          // `null` is a valid option, so the value doubles as the key via its label.
          key={timerLabel(minutes)}
          label={timerLabel(minutes)}
          accessibilityLabel={timerAccessibilityLabel(minutes)}
          selected={minutes === value}
          // The accent fill rather than ink: the session is a night surface, where the
          // near-black of an ink pill would disappear into the background.
          tone="primary"
          size="block"
          onPress={() => onChange(minutes)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACE.s8,
  },
});

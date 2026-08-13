import { StyleSheet, View } from 'react-native';
import { Pill } from './Pill';
import { SPACE } from '../theme/tokens';
import { REMINDER_TIMES } from '../store/settings';
import { formatTimeOfDay, spokenTimeOfDay } from '../utils/time';
import type { TimeOfDay } from '../utils/time';

type Props = {
  /** The chosen time, or null when the reminder is off. */
  value: TimeOfDay | null;
  onChange: (value: TimeOfDay | null) => void;
  testID?: string;
};

/**
 * When a reminder fires, as pills — the same one-tap treatment as the session timer, and
 * for the same reason: this gets set in bed.
 *
 * "Off" is one of the options rather than a separate switch. A reminder needs the OS's
 * permission, so it starts off; a control that could only ever set a time would leave the
 * user no way back.
 */
export function TimeChoices({ value, onChange, testID }: Props) {
  const chosen = value === null ? null : formatTimeOfDay(value);

  return (
    <View testID={testID} style={styles.choices}>
      {REMINDER_TIMES.map((at) => {
        const label = formatTimeOfDay(at);
        return (
          <Pill
            key={label}
            label={label}
            accessibilityLabel={spokenTimeOfDay(at)}
            selected={label === chosen}
            onPress={() => onChange(at)}
          />
        );
      })}
      <Pill label="Off" selected={value === null} onPress={() => onChange(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.s8,
  },
});

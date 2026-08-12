import { StyleSheet, View } from 'react-native';
import { Pill } from './Pill';
import { SPACE } from '../theme/tokens';
import { MOOD_OPTIONS } from '../store/checkIns';
import type { Mood } from '../store/checkIns';

type Props = {
  value: Mood | null;
  onChange: (mood: Mood) => void;
};

/**
 * How the day felt: one word out of six, single-select.
 *
 * Words rather than the faces this screen used to show. An emoji asks the user to match
 * their own state to a cartoon, and six of them side by side gave no answer back — this
 * feeds the trend underneath.
 */
export function MoodChips({ value, onChange }: Props) {
  return (
    <View testID="mood-chips" style={styles.chips}>
      {MOOD_OPTIONS.map((option) => (
        <Pill
          key={option.id}
          label={option.label}
          selected={value === option.id}
          onPress={() => onChange(option.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.s8,
  },
});

import { Pressable, StyleSheet } from 'react-native';
import { Text } from './Text';
import { SPACE } from '../theme/tokens';

type Props = {
  label: string;
  onPress: () => void;
  /** Spoken name, where the visible label is too terse to stand on its own. */
  accessibilityLabel?: string;
  testID?: string;
};

/**
 * A word that acts, in the accent colour and nothing else — the "See more" beside a section
 * label. It carries no border or fill on purpose: a second button next to a section heading
 * would compete with the screen's one real action.
 */
export function TextLink({ label, onPress, accessibilityLabel, testID }: Props) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      // The label is 21pt tall, so the tap area is grown to clear the 44pt minimum.
      hitSlop={{ top: SPACE.s12, bottom: SPACE.s12, left: SPACE.s12, right: SPACE.s12 }}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      <Text variant="bodySecondary" tone="primary">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.6,
  },
});

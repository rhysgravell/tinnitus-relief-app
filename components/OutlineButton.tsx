import { Pressable, StyleSheet } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme/ThemeProvider';
import { LAYOUT, RADIUS, SPACE } from '../theme/tokens';

type Props = {
  label: string;
  onPress: () => void;
  /** Names what it starts, for a label as bare as "Start". */
  accessibilityLabel?: string;
  testID?: string;
};

/**
 * The small pill-shaped action — "Start" beside a routine step.
 *
 * It looks like a `Pill` and is deliberately not one: a pill reports itself as selected or
 * not, which is a claim about state. This is a button that does something, and telling
 * assistive tech it was "not selected" would be describing a control that does not exist.
 */
export function OutlineButton({ label, onPress, accessibilityLabel, testID }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      // 37pt tall, so the hit area is grown to clear the 44pt minimum.
      hitSlop={SPACE.s4}
      style={({ pressed }) => [
        styles.button,
        { borderColor: colors.borderStrong },
        pressed && styles.pressed,
      ]}
    >
      <Text variant="pillLabelStrong" tone="primary">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
    borderWidth: LAYOUT.hairlineWidth,
    // Off the spacing scale, as in the design — a pill's insets are set by its radius
    // rather than by the vertical rhythm.
    paddingVertical: 9,
    paddingHorizontal: SPACE.s16,
    flexShrink: 0,
  },
  pressed: {
    opacity: 0.75,
  },
});

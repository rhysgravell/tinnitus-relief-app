import { Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme/ThemeProvider';
import { RADIUS, SPACE } from '../theme/tokens';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Shrinks to fit its label instead of filling the width — the Saved empty state. */
  inline?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * The filled action button. One per screen at most, so there is no secondary variant
 * here — a screen that needs two actions has the second one as plain text.
 */
export function PrimaryButton({ label, onPress, disabled = false, inline = false, style }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        inline ? styles.inline : styles.fullWidth,
        { backgroundColor: colors.primary },
        // A flat opacity dip rather than a scale: nothing in this design bounces.
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text variant="buttonLabel" tone="onPrimary">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.card,
  },
  fullWidth: {
    alignSelf: 'stretch',
    // 15 sits between the scale's 14 and 16; the design uses it to land the button on a
    // 51pt height with the 21pt label.
    paddingVertical: 15,
  },
  inline: {
    alignSelf: 'center',
    paddingVertical: SPACE.s14,
    paddingHorizontal: SPACE.s24,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.45,
  },
});

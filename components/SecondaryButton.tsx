import { Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme/ThemeProvider';
import { RADIUS } from '../theme/tokens';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * The filled-but-quiet button, on the tinted surface rather than the accent. It is for an
 * action that is the point of the card it sits in but not the point of the screen — "Start
 * now" inside the Tonight card, where an accent fill would compete with the tab bar.
 */
export function SecondaryButton({ label, onPress, disabled = false, style }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.surfaceAlt },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text variant="buttonLabel">{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.secondaryButton,
    // 14 top and bottom against the 21pt label lands the button on the design's 49pt.
    paddingVertical: 14,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.45,
  },
});

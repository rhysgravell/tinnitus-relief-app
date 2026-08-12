import { Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme/ThemeProvider';
import { LAYOUT, RADIUS, SPACE } from '../theme/tokens';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /**
   * Which fill the selected state takes. `ink` is the filter row and the mood chips;
   * `primary` is the session timer, where the accent reads better on a night surface.
   */
  tone?: 'ink' | 'primary';
  /**
   * `compact` is the Sounds filter row, `block` the session timer — five pills sharing
   * the width, so they size from the row rather than from their labels.
   */
  size?: 'default' | 'compact' | 'block';
  /**
   * Spoken name, for a label that is an abbreviation or a glyph — "45m", "∞". Defaults to
   * the label itself, which is right for the ordinary case.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * The pill/chip. Selection is a fill, never a border weight change — a pill that grew
 * a thicker outline when picked would shift the row's layout.
 */
export function Pill({
  label,
  selected = false,
  onPress,
  tone = 'ink',
  size = 'default',
  accessibilityLabel,
  style,
}: Props) {
  const { colors } = useTheme();
  const fill = tone === 'primary' ? colors.primary : colors.text;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      // The pills stand 37–43pt tall, so the hit area is grown to clear the 44pt minimum.
      hitSlop={SPACE.s6}
      style={({ pressed }) => [
        styles.pill,
        styles[size],
        // The border stays on when selected, tinted to the fill: dropping it would make
        // the selected pill 2px smaller than its neighbours and shift the row.
        selected
          ? { backgroundColor: fill, borderColor: fill }
          : { borderColor: colors.borderStrong },
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text
        variant={
          selected ? (tone === 'primary' ? 'pillLabelStrong' : 'pillLabelSelected') : 'bodySecondary'
        }
        tone={selected ? 'onPrimary' : 'secondary'}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
    borderWidth: LAYOUT.hairlineWidth,
  },
  // The horizontal insets are off the spacing scale, as they are in the design — a pill's
  // padding is set by its radius, not by the vertical rhythm.
  default: {
    alignSelf: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 15,
  },
  compact: {
    alignSelf: 'flex-start',
    paddingVertical: SPACE.s8,
    paddingHorizontal: SPACE.s14,
  },
  block: {
    flex: 1,
    paddingVertical: 11,
  },
  pressed: {
    opacity: 0.75,
  },
});

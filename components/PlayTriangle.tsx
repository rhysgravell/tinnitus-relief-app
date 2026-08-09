import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type Props = {
  /** The triangle's width. 16 for the 54px primary button, 11 for the 42px circles. */
  size?: number;
  /** Defaults to the palette accent. Pass `onPrimary` when it sits on a filled circle. */
  color?: string;
  /**
   * Shifts the triangle right so it looks centred inside a circle. A triangle's visual
   * mass sits left of its bounding box, so geometric centring reads as too far left.
   */
  nudge?: boolean;
};

/**
 * A solid vector triangle, built from borders rather than an icon font — this design
 * uses no icon library, and a font glyph would not match the exact proportions.
 */
export function PlayTriangle({ size = 11, color, nudge = true }: Props) {
  const { colors } = useTheme();

  // The design's two triangles are 16 × 20 and 11 × 14, so the half-height is a shade
  // under two thirds of the width in both.
  const halfHeight = Math.round(size * 0.63);

  return (
    <View
      testID="play-triangle"
      style={[
        styles.triangle,
        {
          borderLeftWidth: size,
          borderTopWidth: halfHeight,
          borderBottomWidth: halfHeight,
          borderLeftColor: color ?? colors.primary,
          marginLeft: nudge ? Math.round(size / 4) : 0,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
});

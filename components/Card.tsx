import { StyleSheet, View } from 'react-native';
import type { ViewProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { LAYOUT, RADIUS } from '../theme/tokens';

type Props = ViewProps & {
  /** `hero` is the 18px-radius card used for the resume and Tonight cards. */
  variant?: 'card' | 'hero';
  /** `alt` is the tinted fill used for info cards and the Sleep secondary surface. */
  tone?: 'surface' | 'alt';
  /**
   * Inner padding. Pass 0 for a card whose content goes edge to edge — artwork strips
   * and row lists bring their own padding, so a baked-in inset would fight them.
   */
  padding?: number;
  /** Clips content to the rounded corners. Needed for full-bleed artwork. */
  clip?: boolean;
};

/**
 * The card surface: a fill, a 1px hairline border and a radius. There are no shadows
 * anywhere in this design — separation is always the border.
 */
export function Card({
  variant = 'card',
  tone = 'surface',
  padding = LAYOUT.cardPadding,
  clip = false,
  style,
  ...rest
}: Props) {
  const { colors } = useTheme();

  return (
    <View
      {...rest}
      style={[
        styles.card,
        {
          backgroundColor: tone === 'alt' ? colors.surfaceAlt : colors.surface,
          borderColor: colors.border,
          borderRadius: variant === 'hero' ? RADIUS.hero : RADIUS.card,
          padding,
        },
        clip && styles.clipped,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: LAYOUT.hairlineWidth,
  },
  clipped: {
    overflow: 'hidden',
  },
});

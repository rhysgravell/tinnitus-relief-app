import { StyleSheet, View } from 'react-native';
import type { ViewProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type Props = ViewProps & {
  /**
   * Where the gradient arrives at the background colour, as a percentage of the view's
   * height. 58 on Session, 46 on Sleep — below the stop the screen is flat.
   */
  gradientStop?: number;
};

/**
 * A screen's ground. Paints the palette's background, and lays the night gradient over it
 * where the palette defines one — the light palette has none, so this is flat there.
 *
 * The gradient is a style rather than a library: `experimental_backgroundImage` ships with
 * React Native, which spares the app a native dependency and a rebuild. It is still
 * prefixed as experimental, so the flat background is painted underneath it — a runtime
 * that ignores the style loses the subtle lift at the top and nothing else.
 */
export function ScreenBackground({ gradientStop = 58, style, ...rest }: Props) {
  const { colors } = useTheme();
  const gradient = colors.backgroundGradient;

  return (
    <View
      {...rest}
      style={[
        styles.fill,
        { backgroundColor: colors.background },
        gradient
          ? {
              experimental_backgroundImage: `linear-gradient(180deg, ${gradient[0]} 0%, ${gradient[1]} ${gradientStop}%)`,
            }
          : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});

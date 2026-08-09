import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { MOTION } from '../theme/tokens';

const WIDTH = 50;
const HEIGHT = 30;
const INSET = 3;
const KNOB = HEIGHT - INSET * 2;
const TRAVEL = WIDTH - KNOB - INSET * 2;

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Required: the switch carries no visible label of its own. */
  accessibilityLabel: string;
  disabled?: boolean;
};

/**
 * The settings switch. Knob and track cross-fade over the standard 240ms rather than
 * snapping, and the knob slides — the two together read as one movement.
 */
export function Toggle({ value, onValueChange, accessibilityLabel, disabled = false }: Props) {
  const { colors, scheme } = useTheme();
  // Held in state rather than a ref: the animated value is read while rendering, which is
  // what a ref is not for.
  const [progress] = useState(() => new Animated.Value(value ? 1 : 0));
  const animateChanges = useRef(false);

  useEffect(() => {
    if (!animateChanges.current) {
      // Settings opens with its switches already in place. Animating on mount would set
      // every row moving as the screen appears.
      animateChanges.current = true;
      return;
    }

    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: MOTION.transitionMs,
      easing: Easing.out(Easing.ease),
      // The track colour animates alongside the knob, and colour interpolation cannot
      // run on the native thread.
      useNativeDriver: false,
    }).start();
  }, [progress, value]);

  // The handoff only ever shows a night toggle switched on, where the knob is the
  // background colour. Off on a night surface needs a light knob instead, or it
  // disappears into the track.
  const knobColor = value ? colors.onPrimary : scheme === 'dark' ? colors.textMuted : colors.surface;

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      // 30pt tall, so the hit area is grown to clear the 44pt minimum.
      hitSlop={7}
    >
      <Animated.View
        testID="toggle-track"
        style={[
          styles.track,
          disabled && styles.disabled,
          {
            backgroundColor: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [colors.track, colors.primary],
            }),
          },
        ]}
      >
        <Animated.View
          testID="toggle-knob"
          style={[
            styles.knob,
            {
              backgroundColor: knobColor,
              transform: [
                { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, TRAVEL] }) },
              ],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    padding: INSET,
    justifyContent: 'center',
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
  },
  disabled: {
    opacity: 0.45,
  },
});

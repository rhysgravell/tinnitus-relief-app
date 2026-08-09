import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../theme/ThemeProvider';
import { MOTION } from '../theme/tokens';

/**
 * The two rings run off one 0 → 1 → 0 cycle. The outer swells as the inner contracts,
 * which is what makes the pair read as breathing rather than as two circles pulsing.
 */
type Phase = { scale: readonly [number, number]; opacity: readonly [number, number] };

const OUTER: Phase = { scale: [0.92, 1.08], opacity: [0.3, 0.62] };
const INNER: Phase = { scale: [1.04, 0.88], opacity: [0.22, 0.46] };

type Props = {
  /** Diameter of the outer ring: 250 on the Session screen, 210 for the onboarding dial. */
  size?: number;
  /** Defaults to the design's ratio — roughly seven tenths of the outer ring. */
  innerSize?: number;
  /** The readout that sits in the middle. */
  children?: ReactNode;
};

/**
 * The only continuous animation in the app: two counter-phased circles on a 6s
 * ease-in-out cycle. It holds still under "reduce motion", frozen at the midpoint of
 * the cycle so the layout keeps the size it would have while animating.
 */
export function BreathingRings({ size = 250, innerSize = Math.round(size * 0.72), children }: Props) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  // Held in state rather than a ref: the animated value is read while rendering, which is
  // what a ref is not for. Starts at the cycle midpoint, where reduced motion holds it.
  const [progress] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(0.5);
      return;
    }

    // Start from the contracted end of the cycle so the first swell takes a full half
    // cycle rather than racing from the static midpoint.
    progress.setValue(0);

    const halfCycle = MOTION.breathingMs / 2;
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: halfCycle,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: halfCycle,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    breathe.start();
    return () => breathe.stop();
  }, [progress, reducedMotion]);

  const ringStyle = (phase: Phase) => ({
    opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [...phase.opacity] }),
    transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [...phase.scale] }) }],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        testID="breathing-ring-outer"
        style={[
          styles.ring,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.ringOuter },
          ringStyle(OUTER),
        ]}
      />
      <Animated.View
        testID="breathing-ring-inner"
        style={[
          styles.ring,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: colors.ringInner,
          },
          ringStyle(INNER),
        ]}
      />
      <View style={styles.readout}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  readout: {
    alignItems: 'center',
  },
});

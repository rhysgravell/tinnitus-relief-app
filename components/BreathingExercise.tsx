import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text as RNText, View } from 'react-native';
import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenBackground } from './ScreenBackground';
import { SecondaryButton } from './SecondaryButton';
import { SectionLabel } from './SectionLabel';
import { Text } from './Text';
import { useCountdownClock } from '../hooks/useCountdownClock';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { LAYOUT, SPACE } from '../theme/tokens';
import { BREATHING_MINUTES } from '../store/routine';
import { breathAt } from '../utils/breathing';
import type { BreathDirection } from '../utils/breathing';
import { formatClock } from '../utils/duration';

/** The circle at its fullest, in points. */
const CIRCLE_SIZE = 200;

/** How far it shrinks on the out-breath. Never to nothing — it is a breath, not a pulse. */
const CONTRACTED = 0.62;

const EXPANDED = 1;

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * The guided breathing from the wind-down routine: a circle to follow, the phase named
 * under it, and four minutes on the clock.
 *
 * A night surface whatever the app is set to, like the session — this is only ever reached
 * from the Sleep screen, and a mist-coloured sheet over it at 11pm would be a shock.
 */
export function BreathingExercise({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <ThemeProvider scheme="dark">
        {/* Mounted only while open, so the clock starts from zero each time rather than
            carrying on from a previous run. */}
        {visible ? <Exercise onClose={onClose} /> : null}
      </ThemeProvider>
    </Modal>
  );
}

function Exercise({ onClose }: { onClose: () => void }) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const [finished, setFinished] = useState(false);

  const { elapsedSeconds, remainingSeconds } = useCountdownClock({
    running: !finished,
    timerMinutes: BREATHING_MINUTES,
    onExpire: () => setFinished(true),
  });

  const { phase, secondsRemaining } = breathAt(elapsedSeconds);

  return (
    <ScreenBackground>
      <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
        <View style={styles.header}>
          <SectionLabel tone="muted">Slow breathing</SectionLabel>
          <Text variant="monoCaption" tone="faint">
            {formatClock(remainingSeconds ?? 0)}
          </Text>
        </View>

        <View style={styles.stage}>
          <Breath direction={phase.direction} seconds={phase.seconds} still={finished || reducedMotion}>
            <RNText style={[styles.count, { color: colors.text }]}>
              {finished ? '' : String(secondsRemaining)}
            </RNText>
          </Breath>

          <View style={styles.caption}>
            <Text variant="sessionTitle">{finished ? "That's four minutes" : phase.label}</Text>
            <Text variant="bodySecondary" tone="muted" style={styles.hint}>
              {finished
                ? 'Carry the same rhythm into bed with you.'
                : 'Follow the circle. Your sound keeps playing underneath.'}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <SecondaryButton label={finished ? 'Done' : 'Stop'} onPress={onClose} />
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

type BreathProps = {
  direction: BreathDirection;
  seconds: number;
  /** Holds the circle at the midpoint — for reduced motion, and once the time is up. */
  still: boolean;
  children: ReactNode;
};

/** The circle. It expands over the in-breath, contracts over the out, and holds between. */
function Breath({ direction, seconds, still, children }: BreathProps) {
  const { colors } = useTheme();
  const [scale] = useState(() => new Animated.Value(CONTRACTED));

  useEffect(() => {
    if (still) {
      scale.setValue((CONTRACTED + EXPANDED) / 2);
      return;
    }
    // A hold is the absence of movement, so there is nothing to animate towards — the
    // circle stays exactly where the phase before it finished.
    if (direction === 'hold') return;

    const animation = Animated.timing(scale, {
      toValue: direction === 'in' ? EXPANDED : CONTRACTED,
      duration: seconds * 1000,
      // Linear, unlike everything else in the app: a breath you are following has to be
      // even, and an eased one would ask you to inhale fastest in the middle.
      easing: Easing.linear,
      useNativeDriver: true,
    });

    animation.start();
    return () => animation.stop();
  }, [direction, scale, seconds, still]);

  return (
    <Animated.View
      testID="breath-circle"
      style={[
        styles.circle,
        {
          backgroundColor: colors.ringInner,
          borderColor: colors.ringOuter,
          transform: [{ scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACE.s14,
    paddingHorizontal: LAYOUT.screenGutter,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.s40,
    paddingHorizontal: SPACE.s24,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    // Off the type scale on purpose: it is a single character read at a glance from across
    // a dark room, not a piece of copy.
    fontSize: 44,
    lineHeight: 52,
  },
  caption: {
    alignItems: 'center',
  },
  hint: {
    marginTop: SPACE.s6,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: SPACE.s24,
    paddingBottom: SPACE.s10,
  },
});

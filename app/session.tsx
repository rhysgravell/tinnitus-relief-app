import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text as RNText, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BreathingRings } from '../components/BreathingRings';
import { SavedStar } from '../components/SavedStar';
import { ScreenBackground } from '../components/ScreenBackground';
import { ScreenStatusBar } from '../components/ScreenStatusBar';
import { SectionLabel } from '../components/SectionLabel';
import { Text } from '../components/Text';
import { TimerRow } from '../components/TimerRow';
import { TransportButton } from '../components/TransportButton';
import { VolumeSlider } from '../components/VolumeSlider';
import { usePlayback } from '../context/PlaybackContext';
import { useSoundStates } from '../context/SoundStateContext';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { LAYOUT, SPACE } from '../theme/tokens';
import { findSound } from '../store/sounds';
import { formatClock } from '../utils/duration';

/** The session insets wider than the tab screens do, as the design draws it. */
const GUTTER = SPACE.s24;

/** The rings, at the diameter the design gives them. */
const RING_SIZE = 250;

const VOLUME_HINT = 'Keep it just below the ringing, not over it.';

export default function SessionRoute() {
  // Session is a night surface whatever the rest of the app is set to, so it brings its
  // own provider rather than reading the root one.
  return (
    <ThemeProvider scheme="dark">
      {/* And the status bar with it, for as long as the session is the screen in front. */}
      <ScreenStatusBar />
      <Session />
    </ThemeProvider>
  );
}

function Session() {
  const router = useRouter();
  const { colors } = useTheme();
  const { soundId } = useLocalSearchParams<{ soundId?: string }>();
  const { stateFor, toggleSaved } = useSoundStates();

  /**
   * Read from the catalogue rather than from playback, so a link to a sound that is not in
   * this build says so instead of showing an empty screen while nothing loads.
   */
  const sound = soundId ? findSound(soundId) : undefined;

  const {
    playing,
    silent,
    volume,
    setVolume,
    timerMinutes,
    setTimerMinutes,
    elapsedSeconds,
    remainingSeconds,
    open,
    toggle,
    stop,
  } = usePlayback();

  useEffect(() => {
    // The screen asks for the sound; the app plays it. Asking for the one already going —
    // coming back to a session handed over to the wind-down routine — leaves it running
    // rather than starting it over.
    if (soundId) open(soundId);
  }, [soundId, open]);

  /** Whether this screen handed the sound on rather than ending it. See below. */
  const handedOver = useRef(false);

  useEffect(() => {
    return () => {
      // Leaving the session ends it, whether by the chevron or by swiping the sheet down —
      // there is no way back to a sound still playing from most of the app, and one left
      // running unattended would be worse than one stopped too eagerly. The moon is the
      // exception: it hands the night over to Sleep, whose routine is written on the
      // assumption the sound is still going underneath it.
      if (!handedOver.current) stop();
    };
  }, [stop]);

  return (
    <ScreenBackground>
      <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close session"
            hitSlop={SPACE.s12}
          >
            {/* A text character rather than an icon: this design ships no icon library. */}
            <RNText style={[styles.chevron, { color: colors.textMuted }]}>⌄</RNText>
          </Pressable>
          <SectionLabel tone="muted">Session</SectionLabel>
          {/* Balances the chevron so the label sits on the screen's centre line. */}
          <View style={styles.chevronSpacer} />
        </View>

        {sound ? (
          <>
            <View style={styles.stage}>
              <BreathingRings size={RING_SIZE}>
                <Text
                  variant="readout"
                  accessibilityLabel={`${formatClock(elapsedSeconds)} played`}
                >
                  {formatClock(elapsedSeconds)}
                </Text>
                <SectionLabel tone="primary" style={styles.remaining}>
                  {remainingSeconds === null ? 'No timer' : `${formatClock(remainingSeconds)} left`}
                </SectionLabel>
              </BreathingRings>

              <View style={styles.naming}>
                <Text variant="sessionTitle">{sound.name}</Text>
                <Text variant="bodySecondary" tone="muted" style={styles.descriptor}>
                  {silent ? 'No recording for this one yet' : sound.descriptor}
                </Text>
              </View>
            </View>

            <View style={styles.controls}>
              <VolumeSlider value={volume} onChange={setVolume} hint={VOLUME_HINT} />
            </View>

            <View style={[styles.controls, styles.timer]}>
              <TimerRow value={timerMinutes} onChange={setTimerMinutes} />
            </View>

            <View style={styles.transport}>
              <SavedStar
                testID="session-saved-star"
                variant="bare"
                saved={stateFor(sound.id).saved}
                soundName={sound.name}
                onPress={() => toggleSaved(sound.id)}
              />
              <TransportButton
                // A silent session is never playing, whatever the transport state says, so
                // the button offers "Play" rather than a "Pause" that would do nothing.
                playing={playing && !silent}
                disabled={silent}
                onPress={toggle}
              />
              <Pressable
                onPress={() => {
                  handedOver.current = true;
                  router.dismissTo('/sleep');
                }}
                accessibilityRole="button"
                accessibilityLabel="Wind down for the night"
                hitSlop={SPACE.s12}
              >
                <RNText style={[styles.moon, { color: colors.textMuted }]}>☾</RNText>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.missing}>
            {/* Reachable only by a deep link to a sound that is not in this build. */}
            <Text variant="emptyTitle">Nothing to play</Text>
            <Text tone="muted" style={styles.missingBody}>
              That sound is not in this version of the app.
            </Text>
          </View>
        )}
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACE.s14,
    paddingHorizontal: LAYOUT.screenGutter,
  },
  chevron: {
    fontSize: 20,
    lineHeight: 20,
  },
  chevronSpacer: {
    width: SPACE.s20,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.s30,
    paddingHorizontal: GUTTER,
  },
  remaining: {
    marginTop: SPACE.s4,
  },
  naming: {
    alignItems: 'center',
  },
  descriptor: {
    marginTop: SPACE.s6,
    textAlign: 'center',
  },
  controls: {
    paddingHorizontal: GUTTER,
  },
  timer: {
    paddingTop: SPACE.s26,
  },
  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.s40,
    paddingTop: SPACE.s26,
    paddingBottom: SPACE.s10,
    paddingHorizontal: GUTTER,
  },
  moon: {
    fontSize: 20,
    lineHeight: 20,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.s8,
    paddingHorizontal: SPACE.s34,
  },
  missingBody: {
    textAlign: 'center',
  },
});

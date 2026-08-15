import { useEffect, useRef, useState } from 'react';
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
import { useSoundStates } from '../context/SoundStateContext';
import { useSessionAudio } from '../hooks/useSessionAudio';
import { useCountdownClock } from '../hooks/useCountdownClock';
import { useSessionSetup } from '../hooks/useSessionSetup';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { LAYOUT, SPACE } from '../theme/tokens';
import { setLastSession } from '../store/sessions';
import { DEFAULT_SETTINGS, getSettings } from '../store/settings';
import type { Settings } from '../store/settings';
import { recordSession } from '../store/soundState';
import { findSound, isPlayable } from '../store/sounds';
import { formatClock, wholeMinutes } from '../utils/duration';

/** The session insets wider than the tab screens do, as the design draws it. */
const GUTTER = SPACE.s24;

/** The rings, at the diameter the design gives them. */
const RING_SIZE = 250;

/**
 * Below this, nothing is recorded. Opening a session and closing it again is not a
 * session, and remembering it would push a real one off the resume card.
 */
const MINIMUM_RECORDED_SECONDS = 30;

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

  const sound = soundId ? findSound(soundId) : undefined;
  /** One sound in the catalogue is still waiting on its recording. */
  const playable = sound !== undefined && isPlayable(sound);

  const [playing, setPlaying] = useState(true);
  /** Null until the read lands. Three of the five settings are this screen's to honour. */
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    let active = true;
    getSettings().then((stored) => {
      if (active) setSettings(stored);
    });
    return () => {
      active = false;
    };
  }, []);

  const {
    volume,
    setVolume,
    timerMinutes,
    setTimerMinutes,
    ready: seeded,
  } = useSessionSetup(sound?.id, settings);

  const { elapsedSeconds, remainingSeconds, restart } = useCountdownClock({
    // Held until the remembered setup lands, so the clock and the sound start together.
    // Held for a sound with no recording too, which is also what keeps it out of the
    // history: the guard below reads a clock that never left zero.
    running: playing && seeded && playable,
    timerMinutes,
    // Stopping rather than dismissing: whoever set a timer is probably asleep, and a
    // screen that vanished on its own would leave them with no idea what happened.
    onExpire: () => setPlaying(false),
  });

  const { silent } = useSessionAudio({
    source: seeded ? (sound?.file ?? null) : null,
    playing,
    volume,
    remainingSeconds,
    fadeOut: settings?.fadeOut ?? DEFAULT_SETTINGS.fadeOut,
    mixWithOthers: settings?.mixWithOthers ?? DEFAULT_SETTINGS.mixWithOthers,
  });

  const toggleTransport = () => {
    // Play after the timer has run out starts another stretch of the same length rather
    // than resuming a session with nothing left on it — which would be silent, since the
    // fade has already taken the volume to zero.
    if (!playing && remainingSeconds === 0) restart();
    setPlaying((current) => !current);
  };

  /** The values as they stood at the end, read by the unmount effect below. */
  const finalRef = useRef({ elapsedSeconds, volume, timerMinutes });
  useEffect(() => {
    finalRef.current = { elapsedSeconds, volume, timerMinutes };
  }, [elapsedSeconds, volume, timerMinutes]);

  useEffect(() => {
    const id = sound?.id;
    if (!id) return;
    // Recorded on the way out rather than from a close handler: this screen is a sheet, so
    // it can be swiped away, and unmounting is the only thing that always happens.
    return () => {
      const final = finalRef.current;
      if (final.elapsedSeconds < MINIMUM_RECORDED_SECONDS) return;
      void recordSession(id, { volume: final.volume, timerMinutes: final.timerMinutes });
      void setLastSession({
        soundId: id,
        endedAt: new Date().toISOString(),
        durationMinutes: wholeMinutes(final.elapsedSeconds),
        timerMinutes: final.timerMinutes,
      });
    };
  }, [sound?.id]);

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
                onPress={toggleTransport}
              />
              <Pressable
                onPress={() => router.dismissTo('/sleep')}
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

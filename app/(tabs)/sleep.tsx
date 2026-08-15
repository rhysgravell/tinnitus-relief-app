import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BreathingExercise } from '../../components/BreathingExercise';
import { OutlineButton } from '../../components/OutlineButton';
import { RoutineStep } from '../../components/RoutineStep';
import { ScreenBackground } from '../../components/ScreenBackground';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenStatusBar } from '../../components/ScreenStatusBar';
import { SectionLabel } from '../../components/SectionLabel';
import { TonightCard } from '../../components/TonightCard';
import { useSoundStates } from '../../context/SoundStateContext';
import { useLastSession } from '../../hooks/useLastSession';
import { useReminder } from '../../hooks/useReminder';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { LAYOUT, SPACE } from '../../theme/tokens';
import { ROUTINE } from '../../store/routine';
import { getSettings } from '../../store/settings';
import type { Settings } from '../../store/settings';
import { tonightSound, tonightSummary } from '../../store/tonight';
import { formatTimeOfDay } from '../../utils/time';

/** The night gradient stops higher up this screen than on the session. */
const GRADIENT_STOP = 46;

export default function SleepRoute() {
  // A night surface whatever the rest of the app is set to, so it brings its own provider
  // rather than reading the root one. The tab bar takes the same scheme from the manifest.
  return (
    <ThemeProvider scheme="dark">
      {/* And the status bar with it, for as long as this is the tab being looked at. */}
      <ScreenStatusBar />
      <Sleep />
    </ThemeProvider>
  );
}

function Sleep() {
  const router = useRouter();
  const { states } = useSoundStates();
  const { session } = useLastSession();
  const windDown = useReminder('windDown');

  const [settings, setSettings] = useState<Settings | null>(null);
  const [breathing, setBreathing] = useState(false);

  useEffect(() => {
    let active = true;
    getSettings().then((stored) => {
      if (active) setSettings(stored);
    });
    return () => {
      active = false;
    };
  }, []);

  const sound = tonightSound(session, states);
  /**
   * The card is held back until everything it states has been read. Rendering early would
   * put "Wind-down at " on screen with nothing after it, and then change the length under
   * the reader as the default timer arrived.
   */
  const at = windDown.ready ? windDown.at : null;
  const ready = at !== null && settings !== null;

  return (
    <ScreenBackground gradientStop={GRADIENT_STOP}>
      <SafeAreaView edges={['top']} style={styles.screen}>
        <ScreenHeader title="Sleep" subtitle="Wind down for the night" />

        <View style={styles.tonight}>
          {ready ? (
            <TonightCard
              time={formatTimeOfDay(at)}
              summary={tonightSummary(sound, settings.defaultTimerMinutes)}
              reminderOn={windDown.enabled}
              onReminderChange={windDown.setEnabled}
              denied={windDown.denied}
              onStart={() => {
                if (sound) router.push({ pathname: '/session', params: { soundId: sound.id } });
              }}
            />
          ) : null}
        </View>

        <SectionLabel size="large" style={styles.routineLabel}>
          Tonight&apos;s routine
        </SectionLabel>

        {/* Scrolls, unlike the design's fixed frame: four steps and the card fit a large
            phone, and overflow a small one. */}
        <ScrollView contentContainerStyle={styles.routine}>
          {ROUTINE.map((step, index) => (
            <RoutineStep
              key={step.id}
              step={step}
              position={index + 1}
              divider={index < ROUTINE.length - 1}
              action={
                step.action === 'breathing' ? (
                  <OutlineButton
                    testID="start-breathing"
                    label="Start"
                    accessibilityLabel="Start slow breathing"
                    onPress={() => setBreathing(true)}
                  />
                ) : null
              }
            />
          ))}
        </ScrollView>

        <BreathingExercise visible={breathing} onClose={() => setBreathing(false)} />
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  tonight: {
    paddingHorizontal: LAYOUT.screenGutter,
  },
  routineLabel: {
    paddingTop: SPACE.s26,
    paddingBottom: SPACE.s8,
    paddingHorizontal: LAYOUT.screenGutter,
  },
  routine: {
    paddingHorizontal: LAYOUT.screenGutter,
    paddingBottom: SPACE.s20,
  },
});

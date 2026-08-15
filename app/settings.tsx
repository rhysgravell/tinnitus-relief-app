import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Card } from '../components/Card';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionLabel } from '../components/SectionLabel';
import { SettingsRow } from '../components/SettingsRow';
import { Text } from '../components/Text';
import { TimeChoices } from '../components/TimeChoices';
import { TimerRow } from '../components/TimerRow';
import { Toggle } from '../components/Toggle';
import { useSettings } from '../context/SettingsContext';
import { useReminder } from '../hooks/useReminder';
import type { Reminder } from '../hooks/useReminder';
import { useTheme } from '../theme/ThemeProvider';
import { LAYOUT, SPACE } from '../theme/tokens';
import { timerAccessibilityLabel, timerSettingLabel } from '../store/settings';
import { formatTimeOfDay, spokenTimeOfDay } from '../utils/time';

/** Which row is open. Only ever one, so the screen stays a screen and not a stack of pickers. */
type OpenRow = 'timer' | 'windDown' | 'checkIn';

/** The line at the foot of the screen. The app name is the design's, not the bundle's. */
const APP_NAME = 'Quiet';
const DISCLAIMER = 'Not a medical device';

/**
 * Settings, reached from the chevron beside the greeting on Sounds rather than a fifth tab.
 *
 * Grouped by what a person is trying to change, with a plain-English line under anything
 * that is not obvious. The design's "Your tone" group is absent: notch filtering ships with
 * the tone-match screen or not at all, and half of it would be a claim the app cannot make.
 */
export default function SettingsRoute() {
  const router = useRouter();
  const { colors } = useTheme();
  const { settings, update } = useSettings();
  const windDown = useReminder('windDown');
  const checkIn = useReminder('checkIn');
  const [open, setOpen] = useState<OpenRow | null>(null);

  const disclose = (row: OpenRow) => setOpen((current) => (current === row ? null : row));

  // Everything on this screen is read from the same stored settings, so it appears at once
  // rather than filling in row by row under the reader.
  const loaded = settings !== null && windDown.ready && checkIn.ready;
  const version = Constants.expoConfig?.version;

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <ScreenHeader
        title="Settings"
        action={
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            hitSlop={12}
            style={({ pressed }) => (pressed ? styles.pressed : null)}
          >
            <Text tone="muted">Done</Text>
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.body}>
        {loaded ? (
          <>
            <Group label="Playback">
              <SettingsRow
                title="Default timer"
                value={timerSettingLabel(settings.defaultTimerMinutes)}
                valueAccessibilityLabel={timerAccessibilityLabel(settings.defaultTimerMinutes)}
                onPress={() => disclose('timer')}
                expanded={open === 'timer'}
                divider
              >
                <TimerRow
                  value={settings.defaultTimerMinutes}
                  onChange={(minutes) => update({ defaultTimerMinutes: minutes })}
                />
              </SettingsRow>

              <SettingsRow
                title="Fade out at the end"
                control={
                  <Toggle
                    value={settings.fadeOut}
                    onValueChange={(fadeOut) => update({ fadeOut })}
                    accessibilityLabel="Fade out at the end"
                  />
                }
                divider
              />

              <SettingsRow
                title="Play over other apps"
                control={
                  <Toggle
                    value={settings.mixWithOthers}
                    onValueChange={(mixWithOthers) => update({ mixWithOthers })}
                    accessibilityLabel="Play over other apps"
                  />
                }
              />
            </Group>

            <Group label="Night">
              <SettingsRow
                title="Dark after sunset"
                // The phone is what actually decides, so the line says where to set it.
                description="Follows your phone, which can switch itself at sunset"
                control={
                  <Toggle
                    value={settings.darkAfterSunset}
                    onValueChange={(darkAfterSunset) => update({ darkAfterSunset })}
                    accessibilityLabel="Dark after sunset"
                  />
                }
                divider
              />

              <ReminderRow
                title="Wind-down reminder"
                testID="wind-down-times"
                reminder={windDown}
                expanded={open === 'windDown'}
                onPress={() => disclose('windDown')}
                divider
              />

              <ReminderRow
                title="Check-in reminder"
                testID="check-in-times"
                reminder={checkIn}
                expanded={open === 'checkIn'}
                onPress={() => disclose('checkIn')}
              />
            </Group>
          </>
        ) : null}

        <Text variant="meta" tone="faint" style={styles.footer}>
          {version ? `${APP_NAME} ${version} · ${DISCLAIMER}` : DISCLAIMER}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/** A labelled card of rows. The rows bring their own insets, so the card carries none. */
function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View>
      <SectionLabel style={styles.groupLabel}>{label}</SectionLabel>
      {/* Clipped, so the row dividers stop at the card's rounded corners. */}
      <Card padding={0} clip>
        {children}
      </Card>
    </View>
  );
}

type ReminderRowProps = {
  title: string;
  /** Handle for the times this row opens, which are otherwise unnamed. */
  testID: string;
  reminder: Reminder;
  expanded: boolean;
  onPress: () => void;
  divider?: boolean;
};

/**
 * A reminder as a row: the time it fires at, or "Off". The time is shown only when the
 * reminder is actually on — a row reading "22:30" with nothing scheduled behind it would be
 * promising something that never arrives.
 */
function ReminderRow({ title, testID, reminder, expanded, onPress, divider }: ReminderRowProps) {
  const { enabled, at, denied, chooseTime } = reminder;
  const time = enabled ? at : null;

  return (
    <SettingsRow
      title={title}
      description={
        denied ? 'Notifications are off for this app, so there will be no reminder.' : undefined
      }
      value={time ? formatTimeOfDay(time) : 'Off'}
      valueAccessibilityLabel={time ? spokenTimeOfDay(time) : 'Off'}
      onPress={onPress}
      expanded={expanded}
      divider={divider}
    >
      <TimeChoices testID={testID} value={time} onChange={chooseTime} />
    </SettingsRow>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    paddingHorizontal: LAYOUT.screenGutter,
    paddingBottom: SPACE.s20,
    gap: SPACE.s20,
  },
  groupLabel: {
    marginBottom: SPACE.s8,
  },
  footer: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});

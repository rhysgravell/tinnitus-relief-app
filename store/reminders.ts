import { Platform } from 'react-native';
import {
  AndroidImportance,
  SchedulableTriggerInputTypes,
  cancelScheduledNotificationAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
} from 'expo-notifications';
import type { TimeOfDay } from '../utils/time';

/** The two reminders the app can schedule. Both are daily, and neither is on by default. */
export type ReminderKind = 'windDown' | 'checkIn';

type Reminder = {
  /**
   * A fixed identifier rather than one kept in storage: scheduling with the same id
   * replaces what was there, so a reminder can never end up scheduled twice, and
   * cancelling one can name it rather than reaching for
   * `cancelAllScheduledNotificationsAsync` — which would take the other one with it.
   *
   * It doubles as the Android channel id: a notification without a channel is silent, and
   * one channel per reminder is what lets the OS's own settings separate them.
   */
  id: string;
  channelName: string;
  title: string;
  body: string;
  /** The screen this one is asking for. Tapping it should arrive there, not at whatever
   * screen the app happened to be left on. */
  route: string;
};

const REMINDERS: Record<ReminderKind, Reminder> = {
  windDown: {
    id: 'wind-down',
    channelName: 'Wind-down',
    title: 'Time to wind down',
    body: 'Start your sound and let the evening settle.',
    // Sleep rather than straight into a session: the routine is there, and so is the card
    // to start tonight's sound from. Playing something unasked at 10pm would be a fright.
    route: '/sleep',
  },
  checkIn: {
    id: 'check-in',
    channelName: 'Check-in',
    title: 'How was today?',
    body: 'Thirty seconds: how loud it was, and how you are.',
    route: '/check-in',
  },
};

/**
 * What came of asking. `denied` means the OS refused — the caller has to put its switch
 * back, because a switch left on would be promising something that will never arrive.
 */
export type ReminderOutcome = 'scheduled' | 'denied';

/**
 * Schedules a daily reminder, asking permission the first time.
 *
 * Permission is requested here rather than on launch: it is asked for at the moment the
 * user turns a reminder on, which is the only moment the request makes sense.
 */
export async function scheduleReminder(
  kind: ReminderKind,
  at: TimeOfDay
): Promise<ReminderOutcome> {
  if (!(await grantedPermission())) return 'denied';

  const reminder = REMINDERS[kind];

  if (Platform.OS === 'android') {
    await setNotificationChannelAsync(reminder.id, {
      name: reminder.channelName,
      importance: AndroidImportance.DEFAULT,
    });
  }

  await scheduleNotificationAsync({
    identifier: reminder.id,
    content: {
      title: reminder.title,
      body: reminder.body,
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DAILY,
      hour: at.hour,
      minute: at.minute,
      channelId: reminder.id,
    },
  });

  return 'scheduled';
}

/**
 * Where a tapped notification should land, found by the identifier it was scheduled under.
 * Null for anything this app did not schedule, which is nothing today and might be a push
 * message tomorrow.
 */
export function reminderDestination(identifier: string): string | null {
  const reminder = Object.values(REMINDERS).find((entry) => entry.id === identifier);
  return reminder?.route ?? null;
}

export async function cancelReminder(kind: ReminderKind): Promise<void> {
  await cancelScheduledNotificationAsync(REMINDERS[kind].id);
}

/** Asks only if the answer is not already known, so a granted permission is not re-prompted. */
async function grantedPermission(): Promise<boolean> {
  const existing = await getPermissionsAsync();
  if (existing.granted) return true;
  // iOS only ever shows the system prompt once. After a refusal this resolves straight
  // back to denied, which is why the caller has to be able to show that state.
  const requested = await requestPermissionsAsync();
  return requested.granted;
}

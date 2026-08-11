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

/**
 * A fixed identifier rather than one kept in storage: scheduling with the same id replaces
 * what was there, so a reminder can never end up scheduled twice, and cancelling can name
 * this one without reaching for `cancelAllScheduledNotificationsAsync` — which would also
 * take out the check-in reminder once that exists.
 */
const WIND_DOWN_ID = 'wind-down';

/** Android groups notifications by channel, and one without a channel is silent. */
const CHANNEL_ID = 'wind-down';

/**
 * What came of asking. `denied` means the OS refused — the caller has to put its switch
 * back, because a switch left on would be promising something that will never arrive.
 */
export type ReminderOutcome = 'scheduled' | 'denied';

/**
 * Schedules the nightly wind-down reminder, asking permission the first time.
 *
 * Permission is requested here rather than on launch: it is asked for at the moment the
 * user turns the reminder on, which is the only moment the request makes sense.
 */
export async function scheduleWindDown(at: TimeOfDay): Promise<ReminderOutcome> {
  if (!(await grantedPermission())) return 'denied';

  if (Platform.OS === 'android') {
    await setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Wind-down',
      importance: AndroidImportance.DEFAULT,
    });
  }

  await scheduleNotificationAsync({
    identifier: WIND_DOWN_ID,
    content: {
      title: 'Time to wind down',
      body: 'Start your sound and let the evening settle.',
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DAILY,
      hour: at.hour,
      minute: at.minute,
      channelId: CHANNEL_ID,
    },
  });

  return 'scheduled';
}

export async function cancelWindDown(): Promise<void> {
  await cancelScheduledNotificationAsync(WIND_DOWN_ID);
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

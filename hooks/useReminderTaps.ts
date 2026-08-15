import { useEffect, useRef } from 'react';
import { DEFAULT_ACTION_IDENTIFIER, useLastNotificationResponse } from 'expo-notifications';
import { useRouter } from 'expo-router';
import { reminderDestination } from '../store/reminders';
import type { NotificationResponse } from 'expo-notifications';

/**
 * Takes a tapped reminder to the screen it is asking for: the wind-down one to Sleep, the
 * check-in one to Check-in.
 *
 * Without this a reminder opens the app wherever it was last left, which on the phone of
 * someone who was reading the notification at 10pm is the wrong screen and a second thing
 * to do. The hook covers a tap that launched the app as well as one that arrived while it
 * was open — `useLastNotificationResponse` is the same answer for both.
 */
export function useReminderTaps(): void {
  const router = useRouter();
  const response = useLastNotificationResponse();
  /**
   * The response this already acted on. Compared by identity rather than by the
   * notification's id, which is fixed: the same reminder tapped again tomorrow is a new
   * response and has to navigate again.
   */
  const handled = useRef<NotificationResponse | null>(null);

  useEffect(() => {
    // Undefined until the platform has answered, null when nothing has been tapped.
    if (!response || response === handled.current) return;
    handled.current = response;

    // A tap on the notification itself. Anything else is a button on it, and this app
    // ships none — so an unfamiliar action is left alone rather than guessed at.
    if (response.actionIdentifier !== DEFAULT_ACTION_IDENTIFIER) return;

    const destination = reminderDestination(response.notification.request.identifier);
    if (!destination) return;

    // Navigate rather than push: these are tabs, and a reminder tapped every night should
    // not build a stack of them.
    router.navigate(destination);
  }, [response, router]);
}

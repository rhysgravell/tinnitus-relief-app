import { renderHook } from '@testing-library/react-native';
import { DEFAULT_ACTION_IDENTIFIER, useLastNotificationResponse } from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useReminderTaps } from './useReminderTaps';
import type { NotificationResponse } from 'expo-notifications';

jest.mock('expo-notifications', () => ({
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  useLastNotificationResponse: jest.fn(),
}));

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));

const navigate = jest.fn();

/** A tap on a notification scheduled under the given identifier. */
function tap(identifier: string, actionIdentifier = DEFAULT_ACTION_IDENTIFIER) {
  return {
    actionIdentifier,
    notification: { request: { identifier } },
  } as NotificationResponse;
}

/** What the platform is reporting as the most recent tap. */
function lastTap(response: NotificationResponse | null | undefined) {
  jest.mocked(useLastNotificationResponse).mockReturnValue(response);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useRouter).mockReturnValue({ navigate } as unknown as ReturnType<typeof useRouter>);
  lastTap(null);
});

describe('useReminderTaps', () => {
  it('takes the wind-down reminder to Sleep', () => {
    lastTap(tap('wind-down'));
    renderHook(() => useReminderTaps());
    expect(navigate).toHaveBeenCalledWith('/sleep');
  });

  it('takes the check-in reminder to Check-in', () => {
    lastTap(tap('check-in'));
    renderHook(() => useReminderTaps());
    expect(navigate).toHaveBeenCalledWith('/check-in');
  });

  it('goes nowhere when nothing has been tapped', () => {
    renderHook(() => useReminderTaps());
    expect(navigate).not.toHaveBeenCalled();
  });

  it('waits for the platform to answer', () => {
    // Undefined means "not yet", which is not the same as "nothing".
    lastTap(undefined);
    renderHook(() => useReminderTaps());
    expect(navigate).not.toHaveBeenCalled();
  });

  it('ignores a notification this app did not schedule', () => {
    lastTap(tap('some-push-message'));
    renderHook(() => useReminderTaps());
    expect(navigate).not.toHaveBeenCalled();
  });

  it('ignores anything that is not a tap on the notification itself', () => {
    // Buttons on a notification are actions of their own. This app ships none, so an
    // unfamiliar one is left alone rather than guessed at.
    lastTap(tap('check-in', 'snooze'));
    renderHook(() => useReminderTaps());
    expect(navigate).not.toHaveBeenCalled();
  });

  it('navigates once for one tap, however often it re-renders', () => {
    const response = tap('check-in');
    lastTap(response);
    const { rerender } = renderHook(() => useReminderTaps());
    rerender(undefined);
    rerender(undefined);

    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('navigates again for the same reminder tapped the next night', () => {
    // The identifier is fixed, so it is the response that says this is a new tap.
    lastTap(tap('check-in'));
    const { rerender } = renderHook(() => useReminderTaps());

    lastTap(tap('check-in'));
    rerender(undefined);

    expect(navigate).toHaveBeenCalledTimes(2);
  });
});

import { Platform } from 'react-native';
import {
  cancelScheduledNotificationAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
} from 'expo-notifications';
import { cancelWindDown, scheduleWindDown } from './reminders';

jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('wind-down')),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve(null)),
}));

/** A permissions result, of which only `granted` is read. */
function permission(granted: boolean) {
  return { granted } as unknown as Awaited<ReturnType<typeof getPermissionsAsync>>;
}

function alreadyAllowed() {
  jest.mocked(getPermissionsAsync).mockResolvedValue(permission(true));
}

function asksAndIsAllowed() {
  jest.mocked(getPermissionsAsync).mockResolvedValue(permission(false));
  jest.mocked(requestPermissionsAsync).mockResolvedValue(permission(true));
}

function asksAndIsRefused() {
  jest.mocked(getPermissionsAsync).mockResolvedValue(permission(false));
  jest.mocked(requestPermissionsAsync).mockResolvedValue(permission(false));
}

/** The single scheduled request, for asserting on what was actually asked of the OS. */
function scheduled() {
  return jest.mocked(scheduleNotificationAsync).mock.calls[0][0];
}

const AT_2230 = { hour: 22, minute: 30 };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('scheduleWindDown', () => {
  it('schedules the reminder when notifications are already allowed', async () => {
    alreadyAllowed();
    expect(await scheduleWindDown(AT_2230)).toBe('scheduled');
    expect(scheduleNotificationAsync).toHaveBeenCalled();
  });

  it('does not ask again once permission has been given', async () => {
    alreadyAllowed();
    await scheduleWindDown(AT_2230);
    expect(requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('asks for permission the first time', async () => {
    asksAndIsAllowed();
    expect(await scheduleWindDown(AT_2230)).toBe('scheduled');
    expect(requestPermissionsAsync).toHaveBeenCalled();
  });

  it('reports a refusal rather than pretending to have scheduled something', async () => {
    // The switch has to go back off: nothing is going to arrive.
    asksAndIsRefused();
    expect(await scheduleWindDown(AT_2230)).toBe('denied');
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('repeats daily at the time it was given', async () => {
    alreadyAllowed();
    await scheduleWindDown({ hour: 21, minute: 5 });
    expect(scheduled().trigger).toMatchObject({ type: 'daily', hour: 21, minute: 5 });
  });

  it('says what it is for when it arrives', async () => {
    alreadyAllowed();
    await scheduleWindDown(AT_2230);
    expect(scheduled().content.title).toBe('Time to wind down');
  });

  it('uses one fixed identifier so it cannot stack up', async () => {
    // Turning the reminder on twice, or changing its time, has to replace rather than add.
    alreadyAllowed();
    await scheduleWindDown(AT_2230);
    await scheduleWindDown({ hour: 23, minute: 0 });

    const identifiers = jest
      .mocked(scheduleNotificationAsync)
      .mock.calls.map(([request]) => request.identifier);
    expect(identifiers).toEqual(['wind-down', 'wind-down']);
  });

  it('leaves Android channels alone on iOS', () => {
    expect(Platform.OS).toBe('ios');
  });

  describe('on Android', () => {
    beforeEach(() => {
      Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    });

    afterEach(() => {
      Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    });

    it('creates the channel, without which the notification would be silent', async () => {
      alreadyAllowed();
      await scheduleWindDown(AT_2230);

      expect(setNotificationChannelAsync).toHaveBeenCalledWith(
        'wind-down',
        expect.objectContaining({ name: 'Wind-down' })
      );
    });

    it('posts the reminder to that channel', async () => {
      alreadyAllowed();
      await scheduleWindDown(AT_2230);
      expect(scheduled().trigger).toMatchObject({ channelId: 'wind-down' });
    });
  });
});

describe('cancelWindDown', () => {
  it('cancels this reminder by name rather than everything scheduled', async () => {
    // Clearing the lot would take the check-in reminder with it.
    await cancelWindDown();
    expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith('wind-down');
  });
});

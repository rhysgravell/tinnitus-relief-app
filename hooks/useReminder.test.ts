import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { useReminder } from './useReminder';
import * as reminders from '../store/reminders';
import * as settings from '../store/settings';
import { DEFAULT_SETTINGS } from '../store/settings';
import type { ReminderKind } from '../store/reminders';

/** Stored settings with only the parts under test spelled out. */
function stored(patch: Partial<settings.Settings> = {}) {
  jest.spyOn(settings, 'getSettings').mockResolvedValue({ ...DEFAULT_SETTINGS, ...patch });
}

/** The app-state listeners the hook has registered, in place of the real subscription. */
let listeners: ((state: AppStateStatus) => void)[] = [];

/** The app being opened back up, which is when a revoked permission is discovered. */
function foreground() {
  listeners.forEach((listener) => listener('active'));
}

function background() {
  listeners.forEach((listener) => listener('background'));
}

async function setup(kind: ReminderKind = 'windDown') {
  const rendered = renderHook(() => useReminder(kind));
  await waitFor(() => expect(rendered.result.current.ready).toBe(true));
  return rendered;
}

beforeEach(() => {
  jest.restoreAllMocks();

  listeners = [];
  // Removal is real rather than a no-op, so an effect that re-subscribes does not leave a
  // stale listener behind to answer for a state the hook has moved on from.
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
    const listener = handler as (state: AppStateStatus) => void;
    listeners.push(listener);
    return {
      remove: () => {
        listeners = listeners.filter((entry) => entry !== listener);
      },
    } as unknown as ReturnType<typeof AppState.addEventListener>;
  });

  jest.spyOn(settings, 'updateSettings').mockResolvedValue(DEFAULT_SETTINGS);
  jest.spyOn(reminders, 'scheduleReminder').mockResolvedValue('scheduled');
  jest.spyOn(reminders, 'cancelReminder').mockResolvedValue(undefined);
  // The OS agrees with what was stored unless a test says otherwise.
  jest.spyOn(reminders, 'reminderState').mockResolvedValue('scheduled');
  stored();
});

describe('useReminder', () => {
  it('opens on what was stored', async () => {
    stored({ windDownEnabled: true, windDownTime: '21:45' });
    const { result } = await setup();

    expect(result.current.enabled).toBe(true);
    expect(result.current.at).toEqual({ hour: 21, minute: 45 });
  });

  it('is not ready before the read lands', async () => {
    const { result } = renderHook(() => useReminder('windDown'));
    expect(result.current.ready).toBe(false);
    expect(result.current.enabled).toBe(false);
    // Let the read land inside `act` rather than leaving its state update to arrive
    // during the next test, which React warns about.
    await act(async () => {});
  });

  it('reads the keys belonging to the kind it was asked for', async () => {
    // Both reminders are held in the same settings object, so a hook reading the wrong
    // pair of keys would still look like it was working.
    stored({ windDownTime: '22:00', checkInTime: '19:30', checkInEnabled: true });
    const { result } = await setup('checkIn');

    expect(result.current.at).toEqual({ hour: 19, minute: 30 });
    expect(result.current.enabled).toBe(true);
  });

  it('answers the tap before the schedule lands', async () => {
    // A switch that waited for the OS would feel broken.
    jest.spyOn(reminders, 'scheduleReminder').mockReturnValue(new Promise(() => {}));
    const { result } = await setup();

    act(() => result.current.setEnabled(true));
    expect(result.current.enabled).toBe(true);
  });

  it('schedules the reminder for the stored time', async () => {
    stored({ windDownTime: '23:00' });
    const { result } = await setup();

    await act(async () => result.current.setEnabled(true));
    expect(reminders.scheduleReminder).toHaveBeenCalledWith('windDown', { hour: 23, minute: 0 });
  });

  it('remembers that it is on, and at what time', async () => {
    const { result } = await setup();
    await act(async () => result.current.setEnabled(true));

    expect(settings.updateSettings).toHaveBeenCalledWith({
      windDownEnabled: true,
      windDownTime: '22:30',
    });
  });

  it('cancels the reminder when switched off', async () => {
    stored({ windDownEnabled: true });
    const { result } = await setup();

    await act(async () => result.current.setEnabled(false));
    expect(reminders.cancelReminder).toHaveBeenCalledWith('windDown');
    expect(settings.updateSettings).toHaveBeenCalledWith({
      windDownEnabled: false,
      windDownTime: '22:30',
    });
    expect(reminders.scheduleReminder).not.toHaveBeenCalled();
  });

  it('puts the switch back when the OS refuses notifications', async () => {
    // Leaving it on would promise a reminder that is never going to arrive.
    jest.spyOn(reminders, 'scheduleReminder').mockResolvedValue('denied');
    const { result } = await setup();

    await act(async () => result.current.setEnabled(true));

    expect(result.current.enabled).toBe(false);
    expect(result.current.denied).toBe(true);
  });

  it('stores a refusal as off, because off is what it is', async () => {
    jest.spyOn(reminders, 'scheduleReminder').mockResolvedValue('denied');
    const { result } = await setup();

    await act(async () => result.current.setEnabled(true));
    expect(settings.updateSettings).toHaveBeenCalledWith({
      windDownEnabled: false,
      windDownTime: '22:30',
    });
  });

  it('clears the refusal when the user tries again', async () => {
    const schedule = jest.spyOn(reminders, 'scheduleReminder').mockResolvedValue('denied');
    const { result } = await setup();
    await act(async () => result.current.setEnabled(true));
    expect(result.current.denied).toBe(true);

    // Permission can be granted in Settings and the app comes back to a working switch.
    schedule.mockResolvedValue('scheduled');
    await act(async () => result.current.setEnabled(true));

    expect(result.current.denied).toBe(false);
    expect(result.current.enabled).toBe(true);
  });

  it('ignores a tap before the stored time is known', async () => {
    // There would be no time to schedule it for.
    jest.spyOn(settings, 'getSettings').mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useReminder('windDown'));

    act(() => result.current.setEnabled(true));

    expect(result.current.enabled).toBe(false);
    expect(reminders.scheduleReminder).not.toHaveBeenCalled();
  });
});

describe('choosing a time', () => {
  it('turns the reminder on: picking a time is how one is asked for', async () => {
    const { result } = await setup('checkIn');

    await act(async () => result.current.chooseTime({ hour: 20, minute: 30 }));

    expect(result.current.enabled).toBe(true);
    expect(result.current.at).toEqual({ hour: 20, minute: 30 });
    expect(reminders.scheduleReminder).toHaveBeenCalledWith('checkIn', { hour: 20, minute: 30 });
  });

  it('stores the time alongside the switch, in one write', async () => {
    // Two writes could interleave and leave a reminder scheduled for a time the screen is
    // not showing.
    const { result } = await setup('checkIn');

    await act(async () => result.current.chooseTime({ hour: 20, minute: 0 }));

    expect(settings.updateSettings).toHaveBeenCalledTimes(1);
    expect(settings.updateSettings).toHaveBeenCalledWith({
      checkInEnabled: true,
      checkInTime: '20:00',
    });
  });

  it('reschedules an already-scheduled reminder at the new time', async () => {
    stored({ windDownEnabled: true, windDownTime: '22:30' });
    const { result } = await setup();

    await act(async () => result.current.chooseTime({ hour: 21, minute: 0 }));
    expect(reminders.scheduleReminder).toHaveBeenCalledWith('windDown', { hour: 21, minute: 0 });
  });

  it('turns it off on "Off", and keeps the time it was set to', async () => {
    // So switching it back on remembers the choice rather than starting from the default.
    stored({ windDownEnabled: true, windDownTime: '21:30' });
    const { result } = await setup();

    await act(async () => result.current.chooseTime(null));

    expect(result.current.enabled).toBe(false);
    expect(result.current.at).toEqual({ hour: 21, minute: 30 });
    expect(reminders.cancelReminder).toHaveBeenCalledWith('windDown');
    expect(settings.updateSettings).toHaveBeenCalledWith({
      windDownEnabled: false,
      windDownTime: '21:30',
    });
  });

  it('puts the row back to off when the OS refuses', async () => {
    jest.spyOn(reminders, 'scheduleReminder').mockResolvedValue('denied');
    const { result } = await setup('checkIn');

    await act(async () => result.current.chooseTime({ hour: 19, minute: 0 }));

    expect(result.current.enabled).toBe(false);
    expect(result.current.denied).toBe(true);
    // The time is still stored, so the row opens on it if permission is granted later.
    expect(settings.updateSettings).toHaveBeenCalledWith({
      checkInEnabled: false,
      checkInTime: '19:00',
    });
  });
});

describe('checking what the OS will actually do', () => {
  it('asks nothing of the OS for a reminder that is off', async () => {
    await setup();
    expect(reminders.reminderState).not.toHaveBeenCalled();
  });

  it('leaves a reminder that is genuinely scheduled alone', async () => {
    stored({ windDownEnabled: true });
    const { result } = await setup();

    expect(result.current.enabled).toBe(true);
    expect(result.current.denied).toBe(false);
    expect(reminders.scheduleReminder).not.toHaveBeenCalled();
  });

  it('puts the switch back when notifications have been turned off since', async () => {
    // In the phone's own settings, where nothing tells this app it happened. The row would
    // otherwise promise a nudge at 22:30 that is never coming.
    jest.spyOn(reminders, 'reminderState').mockResolvedValue('denied');
    stored({ windDownEnabled: true, windDownTime: '22:30' });
    const { result } = await setup();

    await waitFor(() => expect(result.current.enabled).toBe(false));
    expect(result.current.denied).toBe(true);
    expect(settings.updateSettings).toHaveBeenCalledWith({
      windDownEnabled: false,
      windDownTime: '22:30',
    });
  });

  it('quietly puts back a schedule that went astray', async () => {
    // Permission is intact and only the schedule is gone — a restore onto a new phone.
    // Nobody decided to turn this off, so it goes back rather than being reported off.
    jest.spyOn(reminders, 'reminderState').mockResolvedValue('missing');
    stored({ checkInEnabled: true, checkInTime: '21:00' });
    const { result } = await setup('checkIn');

    await waitFor(() =>
      expect(reminders.scheduleReminder).toHaveBeenCalledWith('checkIn', { hour: 21, minute: 0 })
    );
    expect(result.current.enabled).toBe(true);
    expect(result.current.denied).toBe(false);
  });

  it('gives up honestly when the reschedule is refused too', async () => {
    jest.spyOn(reminders, 'reminderState').mockResolvedValue('missing');
    jest.spyOn(reminders, 'scheduleReminder').mockResolvedValue('denied');
    stored({ windDownEnabled: true });
    const { result } = await setup();

    await waitFor(() => expect(result.current.denied).toBe(true));
    expect(result.current.enabled).toBe(false);
  });

  it('asks again every time the app is opened back up', async () => {
    // Sleep is a tab and stays mounted for the life of the app, so a check on mount alone
    // would be a check once a launch — and permission is revoked while the app is away.
    stored({ windDownEnabled: true });
    const { result } = await setup();
    expect(reminders.reminderState).toHaveBeenCalledTimes(1);

    jest.spyOn(reminders, 'reminderState').mockResolvedValue('denied');
    await act(async () => {
      foreground();
    });

    expect(result.current.enabled).toBe(false);
    expect(result.current.denied).toBe(true);
  });

  it('ignores the app going away rather than coming back', async () => {
    stored({ windDownEnabled: true });
    await setup();
    jest.mocked(reminders.reminderState).mockClear();

    await act(async () => {
      background();
    });

    expect(reminders.reminderState).not.toHaveBeenCalled();
  });
});

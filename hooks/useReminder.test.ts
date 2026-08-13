import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useReminder } from './useReminder';
import * as reminders from '../store/reminders';
import * as settings from '../store/settings';
import { DEFAULT_SETTINGS } from '../store/settings';
import type { ReminderKind } from '../store/reminders';

/** Stored settings with only the parts under test spelled out. */
function stored(patch: Partial<settings.Settings> = {}) {
  jest.spyOn(settings, 'getSettings').mockResolvedValue({ ...DEFAULT_SETTINGS, ...patch });
}

async function setup(kind: ReminderKind = 'windDown') {
  const rendered = renderHook(() => useReminder(kind));
  await waitFor(() => expect(rendered.result.current.ready).toBe(true));
  return rendered;
}

beforeEach(() => {
  jest.restoreAllMocks();
  jest.spyOn(settings, 'updateSettings').mockResolvedValue(DEFAULT_SETTINGS);
  jest.spyOn(reminders, 'scheduleReminder').mockResolvedValue('scheduled');
  jest.spyOn(reminders, 'cancelReminder').mockResolvedValue(undefined);
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

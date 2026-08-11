import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useWindDown } from './useWindDown';
import * as reminders from '../store/reminders';
import * as settings from '../store/settings';
import { DEFAULT_SETTINGS } from '../store/settings';

/** Stored settings with only the wind-down parts spelled out. */
function stored(patch: Partial<settings.Settings> = {}) {
  jest
    .spyOn(settings, 'getSettings')
    .mockResolvedValue({ ...DEFAULT_SETTINGS, ...patch });
}

async function setup() {
  const rendered = renderHook(() => useWindDown());
  await waitFor(() => expect(rendered.result.current.ready).toBe(true));
  return rendered;
}

beforeEach(() => {
  jest.restoreAllMocks();
  jest.spyOn(settings, 'updateSettings').mockResolvedValue(DEFAULT_SETTINGS);
  jest.spyOn(reminders, 'scheduleWindDown').mockResolvedValue('scheduled');
  jest.spyOn(reminders, 'cancelWindDown').mockResolvedValue(undefined);
  stored();
});

describe('useWindDown', () => {
  it('opens on what was stored', async () => {
    stored({ windDownEnabled: true, windDownTime: '21:45' });
    const { result } = await setup();

    expect(result.current.enabled).toBe(true);
    expect(result.current.at).toEqual({ hour: 21, minute: 45 });
  });

  it('is not ready before the read lands', () => {
    const { result } = renderHook(() => useWindDown());
    expect(result.current.ready).toBe(false);
    expect(result.current.enabled).toBe(false);
  });

  it('answers the tap before the schedule lands', async () => {
    // A switch that waited for the OS would feel broken.
    jest.spyOn(reminders, 'scheduleWindDown').mockReturnValue(new Promise(() => {}));
    const { result } = await setup();

    act(() => result.current.setEnabled(true));
    expect(result.current.enabled).toBe(true);
  });

  it('schedules the reminder for the stored time', async () => {
    stored({ windDownTime: '23:00' });
    const { result } = await setup();

    await act(async () => result.current.setEnabled(true));
    expect(reminders.scheduleWindDown).toHaveBeenCalledWith({ hour: 23, minute: 0 });
  });

  it('remembers that it is on', async () => {
    const { result } = await setup();
    await act(async () => result.current.setEnabled(true));
    expect(settings.updateSettings).toHaveBeenCalledWith({ windDownEnabled: true });
  });

  it('cancels the reminder when switched off', async () => {
    stored({ windDownEnabled: true });
    const { result } = await setup();

    await act(async () => result.current.setEnabled(false));
    expect(reminders.cancelWindDown).toHaveBeenCalled();
    expect(settings.updateSettings).toHaveBeenCalledWith({ windDownEnabled: false });
    expect(reminders.scheduleWindDown).not.toHaveBeenCalled();
  });

  it('puts the switch back when the OS refuses notifications', async () => {
    // Leaving it on would promise a reminder that is never going to arrive.
    jest.spyOn(reminders, 'scheduleWindDown').mockResolvedValue('denied');
    const { result } = await setup();

    await act(async () => result.current.setEnabled(true));

    expect(result.current.enabled).toBe(false);
    expect(result.current.denied).toBe(true);
  });

  it('stores a refusal as off, because off is what it is', async () => {
    jest.spyOn(reminders, 'scheduleWindDown').mockResolvedValue('denied');
    const { result } = await setup();

    await act(async () => result.current.setEnabled(true));
    expect(settings.updateSettings).toHaveBeenCalledWith({ windDownEnabled: false });
  });

  it('clears the refusal when the user tries again', async () => {
    const schedule = jest.spyOn(reminders, 'scheduleWindDown').mockResolvedValue('denied');
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
    const { result } = renderHook(() => useWindDown());

    act(() => result.current.setEnabled(true));

    expect(result.current.enabled).toBe(false);
    expect(reminders.scheduleWindDown).not.toHaveBeenCalled();
  });
});

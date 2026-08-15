import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import SettingsScreen from '../../app/settings';
import { SettingsProvider } from '../../context/SettingsContext';
import * as reminders from '../../store/reminders';
import * as settings from '../../store/settings';
import { DEFAULT_SETTINGS } from '../../store/settings';
import { MOTION } from '../../theme/tokens';

// This test lives outside `app/` on purpose — Expo Router bundles every file under the app
// directory as a route. See the guard in ./routes.test.ts.

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// The bundled app config is not read in a test run, so the version is stood in for here.
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '1.4.0' } },
}));

const back = jest.fn();

/** Stored settings with only the parts a test cares about spelled out. */
function stored(patch: Partial<settings.Settings> = {}) {
  jest.mocked(settings.getSettings).mockResolvedValue({ ...DEFAULT_SETTINGS, ...patch });
}

/** Three reads land on mount: the settings, and one per reminder. */
async function renderScreen() {
  // The settings themselves come from the provider at the root of the app, since the
  // palette is one of them and the switch has to repaint the screen it is on.
  const rendered = render(
    <SettingsProvider>
      <SettingsScreen />
    </SettingsProvider>
  );
  await act(async () => {});
  return rendered;
}

/** A settings row, by the name it is read out under. */
function row(name: string) {
  return screen.getByRole('button', { name });
}

function switchFor(name: string) {
  return screen.getByRole('switch', { name });
}

/** What the row shows at its end — "45 min", "22:30", "Off". */
function value(name: string) {
  return row(name).props.accessibilityValue?.text;
}

beforeEach(() => {
  jest.restoreAllMocks();
  // The switches animate for 240ms. Fake timers let the afterEach below land those frames
  // inside `act`, rather than leaving them to arrive during the next test.
  jest.useFakeTimers();
  jest.mocked(useRouter).mockReturnValue({ back } as unknown as ReturnType<typeof useRouter>);
  back.mockClear();

  jest.spyOn(settings, 'getSettings').mockResolvedValue(DEFAULT_SETTINGS);
  jest.spyOn(settings, 'updateSettings').mockResolvedValue(DEFAULT_SETTINGS);
  jest.spyOn(reminders, 'scheduleReminder').mockResolvedValue('scheduled');
  jest.spyOn(reminders, 'cancelReminder').mockResolvedValue(undefined);
});

afterEach(async () => {
  await act(async () => {
    jest.advanceTimersByTime(MOTION.transitionMs);
  });
  jest.useRealTimers();
});

describe('Settings screen', () => {
  it('opens with its title and a way back out', async () => {
    await renderScreen();
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeTruthy();

    fireEvent.press(screen.getByText('Done'));
    expect(back).toHaveBeenCalled();
  });

  it('groups the settings by what a person is trying to change', async () => {
    await renderScreen();
    expect(screen.getByText('Playback')).toBeTruthy();
    expect(screen.getByText('Night')).toBeTruthy();
  });

  it('holds the rows back until everything they state has been read', async () => {
    // Rows that appeared first and corrected themselves afterwards would have the user
    // reading a state that was never true.
    jest.mocked(settings.getSettings).mockReturnValue(new Promise(() => {}));
    await renderScreen();

    expect(screen.queryByText('Default timer')).toBeNull();
    // The disclaimer is static, so it is there from the first frame.
    expect(screen.getByText(/Not a medical device/)).toBeTruthy();
  });

  it('leaves out the settings for a feature that has not shipped', async () => {
    // Notch filtering arrives with the tone-match screen or not at all; a switch for half
    // of it would be a claim the app cannot make.
    await renderScreen();
    expect(screen.queryByText('Matched frequency')).toBeNull();
    expect(screen.queryByText('Notched filtering')).toBeNull();
  });

  it('names the build and says what the app is not', async () => {
    await renderScreen();
    expect(screen.getByText('Quiet 1.4.0 · Not a medical device')).toBeTruthy();
  });
});

describe('the playback settings', () => {
  it('shows the stored default timer in words', async () => {
    stored({ defaultTimerMinutes: 30 });
    await renderScreen();
    expect(value('Default timer')).toBe('30 minutes');
    expect(screen.getByText('30 min')).toBeTruthy();
  });

  it('says when there is no default timer at all', async () => {
    stored({ defaultTimerMinutes: null });
    await renderScreen();
    expect(screen.getByText('No timer')).toBeTruthy();
  });

  it('keeps the timer options behind the row until it is opened', async () => {
    await renderScreen();
    expect(screen.queryByRole('button', { name: '15 minutes' })).toBeNull();

    fireEvent.press(row('Default timer'));
    expect(screen.getByRole('button', { name: '15 minutes' })).toBeTruthy();
  });

  it('stores a new default timer and says so on the row', async () => {
    await renderScreen();
    fireEvent.press(row('Default timer'));

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: '15 minutes' }));
    });

    expect(settings.updateSettings).toHaveBeenCalledWith({ defaultTimerMinutes: 15 });
    expect(screen.getByText('15 min')).toBeTruthy();
  });

  it('closes the row it was asked to close', async () => {
    await renderScreen();
    fireEvent.press(row('Default timer'));
    fireEvent.press(row('Default timer'));

    expect(screen.queryByRole('button', { name: '15 minutes' })).toBeNull();
  });

  it('opens one row at a time', async () => {
    // Three open pickers would be a screen of controls rather than a list of settings.
    await renderScreen();
    fireEvent.press(row('Default timer'));
    fireEvent.press(row('Check-in reminder'));

    expect(screen.queryByRole('button', { name: '15 minutes' })).toBeNull();
    expect(screen.getByRole('button', { name: '9 pm' })).toBeTruthy();
  });

  it('opens the switches on what was stored', async () => {
    stored({ fadeOut: false, mixWithOthers: true });
    await renderScreen();

    expect(switchFor('Fade out at the end').props.accessibilityState).toMatchObject({
      checked: false,
    });
    expect(switchFor('Play over other apps').props.accessibilityState).toMatchObject({
      checked: true,
    });
  });

  it('stores the fade, and answers the tap before the write lands', async () => {
    jest.mocked(settings.updateSettings).mockReturnValue(new Promise(() => {}));
    await renderScreen();

    await act(async () => {
      fireEvent.press(switchFor('Fade out at the end'));
    });

    expect(settings.updateSettings).toHaveBeenCalledWith({ fadeOut: false });
    expect(switchFor('Fade out at the end').props.accessibilityState).toMatchObject({
      checked: false,
    });
  });

  it('stores whether to play over other apps', async () => {
    await renderScreen();
    await act(async () => {
      fireEvent.press(switchFor('Play over other apps'));
    });
    expect(settings.updateSettings).toHaveBeenCalledWith({ mixWithOthers: true });
  });
});

describe('the night settings', () => {
  it('says where dimming after sunset is actually decided', async () => {
    // The phone is what switches, so the line points at the setting that does the work
    // rather than leaving the user to wonder why nothing happened at sunset.
    await renderScreen();
    expect(screen.getByText('Follows your phone, which can switch itself at sunset')).toBeTruthy();
  });

  it('stores whether to dim after sunset', async () => {
    await renderScreen();
    await act(async () => {
      fireEvent.press(switchFor('Dark after sunset'));
    });
    expect(settings.updateSettings).toHaveBeenCalledWith({ darkAfterSunset: false });
  });

  it('says a reminder is off rather than showing a time nothing will fire at', async () => {
    await renderScreen();
    expect(value('Wind-down reminder')).toBe('Off');
    expect(value('Check-in reminder')).toBe('Off');
  });

  it('shows the time a scheduled reminder will arrive at', async () => {
    stored({ windDownEnabled: true, windDownTime: '22:00' });
    await renderScreen();
    expect(value('Wind-down reminder')).toBe('10 pm');
  });

  it('schedules the wind-down reminder for a time picked on the row', async () => {
    // The gap the Sleep screen left: it can switch this reminder on, but only Settings can
    // say when it fires.
    await renderScreen();
    fireEvent.press(row('Wind-down reminder'));

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: '11 pm' }));
    });

    expect(reminders.scheduleReminder).toHaveBeenCalledWith('windDown', { hour: 23, minute: 0 });
    expect(value('Wind-down reminder')).toBe('11 pm');
  });

  it('schedules the check-in reminder from its own row', async () => {
    await renderScreen();
    fireEvent.press(row('Check-in reminder'));

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: '7:30 pm' }));
    });

    expect(reminders.scheduleReminder).toHaveBeenCalledWith('checkIn', { hour: 19, minute: 30 });
  });

  it('cancels a reminder switched off from its row', async () => {
    stored({ checkInEnabled: true });
    await renderScreen();
    fireEvent.press(row('Check-in reminder'));

    await act(async () => {
      // Scoped to the open row: a closed reminder row reads "Off" too.
      fireEvent.press(within(screen.getByTestId('check-in-times')).getByRole('button', { name: 'Off' }));
    });

    expect(reminders.cancelReminder).toHaveBeenCalledWith('checkIn');
    expect(value('Check-in reminder')).toBe('Off');
  });

  it('says why the row went back to off when notifications are refused', async () => {
    // A row that silently sprang back would look broken.
    jest.mocked(reminders.scheduleReminder).mockResolvedValue('denied');
    await renderScreen();
    fireEvent.press(row('Check-in reminder'));

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: '9 pm' }));
    });

    expect(value('Check-in reminder')).toBe('Off');
    expect(screen.getByText(/Notifications are off for this app/)).toBeTruthy();
  });

  it('leaves the other reminder alone when one is set', async () => {
    // Both live in the same stored settings, so a mix-up here would be easy to miss.
    await renderScreen();
    fireEvent.press(row('Check-in reminder'));

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: '9 pm' }));
    });

    expect(value('Wind-down reminder')).toBe('Off');
    expect(reminders.scheduleReminder).toHaveBeenCalledTimes(1);
  });
});

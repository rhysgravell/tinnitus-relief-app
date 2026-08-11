import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useEffect } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import SleepScreen from '../../app/(tabs)/sleep';
import { SoundStateProvider } from '../../context/SoundStateContext';
import * as reminders from '../../store/reminders';
import * as sessions from '../../store/sessions';
import * as settings from '../../store/settings';
import * as soundState from '../../store/soundState';
import { DEFAULT_SETTINGS } from '../../store/settings';
import { DEFAULT_SOUND_STATE } from '../../store/soundState';
import type { LastSession } from '../../store/sessions';

// This test lives outside `app/` on purpose — Expo Router bundles every file under the app
// directory as a route. See the guard in ./routes.test.ts.

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  // The real hook needs a navigator; running the effect once matches a first focus.
  useFocusEffect: jest.fn(),
}));

const push = jest.fn();

const lastSession: LastSession = {
  soundId: 'evening-forest',
  endedAt: new Date().toISOString(),
  durationMinutes: 30,
  timerMinutes: 45,
};

/** Several reads land on mount — settings, the last session, the provider. */
async function renderScreen() {
  const rendered = render(
    <SoundStateProvider>
      <SleepScreen />
    </SoundStateProvider>
  );
  await act(async () => {});
  return rendered;
}

function reminder() {
  return screen.getByRole('switch');
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(useFocusEffect).mockImplementation((effect) => {
    // Calling a hook here is legal: the mock stands in for a hook, so it runs during a
    // component's render.
    useEffect(() => effect(), [effect]);
  });

  jest.spyOn(settings, 'getSettings').mockResolvedValue(DEFAULT_SETTINGS);
  jest.spyOn(settings, 'updateSettings').mockResolvedValue(DEFAULT_SETTINGS);
  jest.spyOn(sessions, 'getLastSession').mockResolvedValue(null);
  jest.spyOn(soundState, 'getSoundStates').mockResolvedValue({});
  jest.spyOn(soundState, 'migrateFavourites').mockResolvedValue(undefined);
  jest.spyOn(reminders, 'scheduleWindDown').mockResolvedValue('scheduled');
  jest.spyOn(reminders, 'cancelWindDown').mockResolvedValue(undefined);
});

describe('Sleep screen', () => {
  it('holds the card back until everything it states has been read', async () => {
    // "Wind-down at " with nothing after it, and a length that changed as the default
    // timer landed, are both worse than a card that appears a moment later.
    jest.mocked(settings.getSettings).mockReturnValue(new Promise(() => {}));
    render(
      <SoundStateProvider>
        <SleepScreen />
      </SoundStateProvider>
    );
    await act(async () => {});

    expect(screen.queryByTestId('tonight-card')).toBeNull();
    // The routine is static copy, so it is there from the first frame.
    expect(screen.getByText('Dim the lights')).toBeTruthy();
  });

  it('opens with the screen title and what it is for', async () => {
    await renderScreen();
    expect(screen.getByRole('heading', { name: 'Sleep' })).toBeTruthy();
    expect(screen.getByText('Wind down for the night')).toBeTruthy();
  });

  it('leads with tonight, at the stored time', async () => {
    await renderScreen();
    expect(screen.getByText('Wind-down at 22:30')).toBeTruthy();
  });

  it('names what tonight will play and for how long', async () => {
    jest.mocked(sessions.getLastSession).mockResolvedValue(lastSession);
    await renderScreen();
    expect(screen.getByText('45 min · Evening Forest')).toBeTruthy();
  });

  it('offers something to play for a user with no history at all', async () => {
    await renderScreen();
    expect(screen.getByText(/^45 min · /)).toBeTruthy();
  });

  it('takes the length from the default timer rather than from last night', async () => {
    // The session has not started, so it will open on the default.
    jest.mocked(settings.getSettings).mockResolvedValue({
      ...DEFAULT_SETTINGS,
      defaultTimerMinutes: 15,
    });
    jest.mocked(sessions.getLastSession).mockResolvedValue(lastSession);
    await renderScreen();

    expect(screen.getByText('15 min · Evening Forest')).toBeTruthy();
  });

  it('starts tonight from the card', async () => {
    jest.mocked(sessions.getLastSession).mockResolvedValue(lastSession);
    await renderScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Start now' }));
    expect(push).toHaveBeenCalledWith({
      pathname: '/session',
      params: { soundId: 'evening-forest' },
    });
  });

  it('opens with the reminder off until it has been asked for', async () => {
    await renderScreen();
    expect(reminder().props.accessibilityState).toMatchObject({ checked: false });
  });

  it('schedules the reminder when it is switched on', async () => {
    await renderScreen();
    await act(async () => {
      fireEvent(reminder(), 'valueChange', true);
    });

    expect(reminders.scheduleWindDown).toHaveBeenCalledWith({ hour: 22, minute: 30 });
    expect(reminder().props.accessibilityState).toMatchObject({ checked: true });
  });

  it('cancels it again when it is switched off', async () => {
    jest
      .mocked(settings.getSettings)
      .mockResolvedValue({ ...DEFAULT_SETTINGS, windDownEnabled: true });
    await renderScreen();
    expect(reminder().props.accessibilityState).toMatchObject({ checked: true });

    await act(async () => {
      fireEvent(reminder(), 'valueChange', false);
    });
    expect(reminders.cancelWindDown).toHaveBeenCalled();
  });

  it('puts the switch back and says why when notifications are refused', async () => {
    jest.mocked(reminders.scheduleWindDown).mockResolvedValue('denied');
    await renderScreen();

    await act(async () => {
      fireEvent(reminder(), 'valueChange', true);
    });

    expect(reminder().props.accessibilityState).toMatchObject({ checked: false });
    expect(screen.getByText(/Notifications are off for this app/)).toBeTruthy();
  });

  it('lists the routine in order, numbered', async () => {
    await renderScreen();
    expect(screen.getByText('Dim the lights')).toBeTruthy();
    expect(screen.getByText('Put the screens down')).toBeTruthy();
    expect(screen.getByText('Slow breathing · 4 min')).toBeTruthy();
    expect(screen.getByText('Cool, dark, quiet room')).toBeTruthy();

    for (const numeral of ['1', '2', '3', '4']) {
      expect(screen.getByText(numeral)).toBeTruthy();
    }
  });

  it('offers the one step the app can do itself, and only that one', async () => {
    await renderScreen();
    expect(screen.getByRole('button', { name: 'Start slow breathing' })).toBeTruthy();
    expect(screen.getAllByText('Start')).toHaveLength(1);
  });

  it('opens the guided breathing in place rather than navigating away', async () => {
    // The sound is playing from the session behind this; leaving would stop it.
    await renderScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Start slow breathing' }));

    expect(screen.getByText('Breathe in')).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });

  it('shows what a saved sound is when there is no session to repeat', async () => {
    jest.mocked(soundState.getSoundStates).mockResolvedValue({
      'at-the-beach': { ...DEFAULT_SOUND_STATE, saved: true, sessionCount: 4 },
    });
    await renderScreen();

    expect(screen.getByText('45 min · At the Beach')).toBeTruthy();
  });
});

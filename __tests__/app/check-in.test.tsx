import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import CheckInScreen from '../../app/(tabs)/check-in';
import * as checkIns from '../../store/checkIns';
import * as sessions from '../../store/sessions';
import type { CheckIn, Loudness } from '../../store/checkIns';
import type { Session } from '../../store/sessions';

// This test lives outside `app/` on purpose — Expo Router bundles every file under the app
// directory as a route. See the guard in ./routes.test.ts.

jest.mock('expo-router', () => ({
  // The real hook needs a navigator; running the effect once matches a first focus.
  useFocusEffect: jest.fn(),
}));

/** Midday on 14 August 2026, which is "today" throughout. */
const NOW = new Date(2026, 7, 14, 12, 0);

/** Re-runs the focus effect, as switching back to the tab would. */
let refocus: () => Promise<void>;

function entry(date: string, loudness: Loudness, mood: checkIns.Mood = 'calm'): CheckIn {
  return { date, loudness, mood };
}

function history(entries: CheckIn[]) {
  jest.spyOn(checkIns, 'getCheckIns').mockResolvedValue(entries);
}

/** Sessions that ended at 10pm on each of the given nights, in local time. */
function ranOn(dates: string[]) {
  const log: Session[] = dates.map((date) => ({
    soundId: 'underwater',
    endedAt: new Date(`${date}T22:00:00`).toISOString(),
    durationMinutes: 30,
    timerMinutes: 45,
  }));
  jest.spyOn(sessions, 'getSessions').mockResolvedValue(log);
}

/** The history read lands on mount, so every case waits for it. */
async function renderScreen() {
  const rendered = render(<CheckInScreen />);
  await act(async () => {});
  return rendered;
}

function saveButton() {
  return screen.getByRole('button', { name: /^(Save today|Update today|Saved)$/ });
}

async function answer(loudness: number, mood: string) {
  fireEvent.press(screen.getByLabelText(`Level ${loudness} of 5`));
  fireEvent.press(screen.getByRole('button', { name: mood }));
  await act(async () => {});
}

beforeEach(() => {
  jest.restoreAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(NOW);

  jest.mocked(useFocusEffect).mockImplementation((effect) => {
    // Calling a hook here is legal: the mock stands in for a hook, so it runs during a
    // component's render.
    useEffect(() => effect(), [effect]);
    refocus = async () => {
      await act(async () => {
        effect();
      });
    };
  });

  history([]);
  ranOn([]);
  jest.spyOn(checkIns, 'saveCheckIn').mockImplementation(async (saved) => [saved]);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('Check-in screen', () => {
  it('opens with the question it is asking and how long it takes', async () => {
    await renderScreen();
    expect(screen.getByRole('heading', { name: 'How was today?' })).toBeTruthy();
    expect(screen.getByText('Thirty seconds, once a day')).toBeTruthy();
  });

  it('asks about the ringing before it asks about the mood', async () => {
    // Loudness is the thing that actually changes, so it leads.
    await renderScreen();
    expect(screen.getByText('How loud was the ringing?')).toBeTruthy();
    expect(screen.getByText('And how did you feel?')).toBeTruthy();
  });

  it('will not save until both questions are answered', async () => {
    await renderScreen();
    expect(saveButton().props.accessibilityState).toMatchObject({ disabled: true });

    fireEvent.press(screen.getByLabelText('Level 3 of 5'));
    expect(saveButton().props.accessibilityState).toMatchObject({ disabled: true });

    fireEvent.press(screen.getByRole('button', { name: 'Calm' }));
    expect(saveButton().props.accessibilityState).toMatchObject({ disabled: false });
  });

  it('files the day under today', async () => {
    await renderScreen();
    await answer(4, 'Anxious');
    await act(async () => {
      fireEvent.press(saveButton());
    });

    expect(checkIns.saveCheckIn).toHaveBeenCalledWith({
      date: '2026-08-14',
      loudness: 4,
      mood: 'anxious',
    });
  });

  it('says so in the button once the day has landed', async () => {
    // There is no toast in this design, so the label is the confirmation.
    await renderScreen();
    await answer(4, 'Anxious');
    await act(async () => {
      fireEvent.press(saveButton());
    });

    expect(screen.getByText('Saved')).toBeTruthy();
    expect(saveButton().props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('offers to update the day rather than adding a second entry', async () => {
    history([entry('2026-08-14', 2)]);
    await renderScreen();

    expect(screen.getByText('Saved')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Level 5 of 5'));
    expect(screen.getByText('Update today')).toBeTruthy();
  });

  it('shows today as it was left rather than as a blank form', async () => {
    history([entry('2026-08-14', 2, 'good')]);
    await renderScreen();

    expect(screen.getByLabelText('Level 2 of 5').props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByRole('button', { name: 'Good' }).props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it('heads the trend with the window it is showing', async () => {
    await renderScreen();
    expect(screen.getByText('Last 14 days')).toBeTruthy();
  });

  it('says what it is waiting for before there is anything to show', async () => {
    await renderScreen();
    expect(screen.queryByTestId('trend-chart')).toBeNull();
    expect(screen.getByText('Check in for a few days and your own pattern shows up here.')).toBeTruthy();
  });

  it('pays off the same second the day is saved', async () => {
    // The new bar appearing is the whole reason this screen replaced the mood bubbles.
    await renderScreen();
    await answer(3, 'Calm');
    await act(async () => {
      fireEvent.press(saveButton());
    });

    expect(screen.getByTestId('trend-chart')).toBeTruthy();
    expect(screen.getByTestId('trend-bar-2026-08-14')).toBeTruthy();
  });

  it('draws the fortnight, gaps included, and reads the direction out', async () => {
    history([entry('2026-08-02', 5), entry('2026-08-12', 2), entry('2026-08-14', 2)]);
    await renderScreen();

    expect(screen.getByTestId('trend-bar-2026-08-12')).toBeTruthy();
    // Outside the window, and not dragged into it.
    expect(screen.queryByTestId('trend-bar-2026-08-01')).toBeNull();
    expect(screen.getByText(/^Quieter lately/)).toBeTruthy();
  });

  it('sets the loud nights against the quiet ones once there are sessions behind them', async () => {
    // The sentence the design asks for, and the reason the log exists at all.
    history([
      entry('2026-08-09', 4),
      entry('2026-08-10', 2),
      entry('2026-08-11', 4),
      entry('2026-08-12', 2),
      entry('2026-08-13', 4),
      entry('2026-08-14', 2),
    ]);
    ranOn(['2026-08-10', '2026-08-12', '2026-08-14']);
    await renderScreen();

    expect(
      screen.getByText('Quieter on the nights you ran a session — 3 of the last 14.')
    ).toBeTruthy();
  });

  it('offers the wider window only when there is history behind the fortnight', async () => {
    history([entry('2026-08-12', 2)]);
    await renderScreen();
    expect(screen.queryByTestId('trend-range')).toBeNull();
  });

  it('widens the window to a month and back again', async () => {
    history([entry('2026-07-20', 4), entry('2026-08-12', 2)]);
    await renderScreen();

    fireEvent.press(screen.getByTestId('trend-range'));
    expect(screen.getByText('Last 30 days')).toBeTruthy();
    expect(screen.getByTestId('trend-bar-2026-07-20')).toBeTruthy();

    fireEvent.press(screen.getByTestId('trend-range'));
    expect(screen.getByText('Last 14 days')).toBeTruthy();
    expect(screen.queryByTestId('trend-bar-2026-07-20')).toBeNull();
  });

  it('starts a fresh day when the screen is returned to after midnight', async () => {
    history([entry('2026-08-14', 2)]);
    await renderScreen();
    expect(screen.getByText('Saved')).toBeTruthy();

    jest.setSystemTime(new Date(2026, 7, 15, 0, 30));
    await refocus();

    expect(screen.getByText('Save today')).toBeTruthy();
    expect(screen.getByLabelText('Level 2 of 5').props.accessibilityState).toMatchObject({
      selected: false,
    });
  });
});

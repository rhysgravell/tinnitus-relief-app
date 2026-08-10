import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useEffect } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import SoundsScreen from '../../app/(tabs)/index';
import { SoundStateProvider } from '../../context/SoundStateContext';
import * as sessions from '../../store/sessions';
import * as soundState from '../../store/soundState';
import { SOUNDS } from '../../store/sounds';
import type { LastSession } from '../../store/sessions';

// This test lives outside `app/` on purpose — Expo Router bundles every file under the app
// directory as a route. See the guard in ./routes.test.ts.

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  // The real hook needs a navigator; running the effect once matches a first focus.
  useFocusEffect: jest.fn(),
}));

const push = jest.fn();
const mockUseFocusEffect = jest.mocked(useFocusEffect);

/**
 * Yesterday at 22:30. Relative to the clock rather than a fixed date, because the card
 * words itself relative to now — a hardcoded date reads as "Last night" on the day it is
 * written and "3 days ago" by the end of the week.
 */
function lastNight(): string {
  const when = new Date();
  when.setDate(when.getDate() - 1);
  when.setHours(22, 30, 0, 0);
  return when.toISOString();
}

const lastSession: LastSession = {
  soundId: 'underwater',
  endedAt: lastNight(),
  durationMinutes: 42,
  timerMinutes: 45,
};

/**
 * The provider and the resume card both read storage as they mount. Flushing those reads
 * here keeps them from landing in the middle of a test's assertions.
 */
async function renderScreen() {
  const rendered = render(
    <SoundStateProvider>
      <SoundsScreen />
    </SoundStateProvider>
  );
  await act(async () => {});
  return rendered;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  mockUseFocusEffect.mockImplementation((effect) => {
    // Run once after mount, the way a first focus does — not on every render, or every
    // press in a test would kick off another read. Calling a hook here is legal: the mock
    // stands in for a hook, so it runs during a component's render.
    useEffect(() => effect(), [effect]);
  });
  jest.spyOn(sessions, 'getLastSession').mockResolvedValue(null);
  jest.spyOn(soundState, 'getSoundStates').mockResolvedValue({});
  // The provider migrates the pre-redesign favourites before its first read. That is not
  // what these tests are about, and it reaches real storage on every one of them.
  jest.spyOn(soundState, 'migrateFavourites').mockResolvedValue(undefined);
  jest.spyOn(soundState, 'toggleSaved').mockResolvedValue(true);
});

describe('Sounds screen', () => {
  it('opens with a greeting and the screen title', async () => {
    await renderScreen();
    expect(screen.getByText(/^Good (morning|afternoon|evening)$/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: "Let's settle things" })).toBeTruthy();
  });

  it('lists the whole catalogue under the All filter', async () => {
    await renderScreen();
    for (const sound of SOUNDS) {
      expect(screen.getByText(sound.name)).toBeTruthy();
    }
  });

  it('offers the four filter chips with All selected', async () => {
    await renderScreen();
    for (const label of ['All', 'Rain', 'Nature', 'Noise']) {
      expect(screen.getByRole('button', { name: label })).toBeTruthy();
    }
    expect(
      screen.getByRole('button', { name: 'All' }).props.accessibilityState
    ).toMatchObject({ selected: true });
  });

  it('narrows the grid to a category when its chip is tapped', async () => {
    await renderScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Nature' }));

    expect(screen.getByText('Evening Forest')).toBeTruthy();
    expect(screen.queryByText('Underwater')).toBeNull();
  });

  it('goes back to everything when All is tapped again', async () => {
    await renderScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Noise' }));
    fireEvent.press(screen.getByRole('button', { name: 'All' }));
    expect(screen.getByText('Evening Forest')).toBeTruthy();
  });

  it('opens the session for the sound that was tapped', async () => {
    await renderScreen();
    fireEvent.press(screen.getByTestId('sound-card-underwater'));
    expect(push).toHaveBeenCalledWith({
      pathname: '/session',
      params: { soundId: 'underwater' },
    });
  });

  it('reaches Settings from the header rather than a fifth tab', async () => {
    await renderScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Settings' }));
    expect(push).toHaveBeenCalledWith('/settings');
  });

  it('saves a sound in place without navigating', async () => {
    await renderScreen();
    fireEvent.press(screen.getByTestId('saved-star-underwater'));

    await waitFor(() =>
      expect(screen.getByTestId('saved-star-underwater').props.accessibilityLabel).toBe(
        'Remove Underwater from saved'
      )
    );
    expect(push).not.toHaveBeenCalled();
  });

  it('shows a sound the user has already saved as saved', async () => {
    jest
      .spyOn(soundState, 'getSoundStates')
      .mockResolvedValue({ underwater: { ...soundState.DEFAULT_SOUND_STATE, saved: true } });
    await renderScreen();

    await waitFor(() =>
      expect(screen.getByTestId('saved-star-underwater').props.accessibilityLabel).toBe(
        'Remove Underwater from saved'
      )
    );
  });

  it('hides the resume card for a first-run user with no history', async () => {
    await renderScreen();
    await waitFor(() => expect(screen.queryByText('Continue')).toBeNull());
  });

  it('leads with the resume card once there is a session to resume', async () => {
    jest.spyOn(sessions, 'getLastSession').mockResolvedValue(lastSession);
    await renderScreen();

    await waitFor(() => expect(screen.getByText('Continue')).toBeTruthy());
    expect(screen.getByText('Last night · 42 min · timer 45m')).toBeTruthy();
  });

  it('resumes the remembered sound from the card', async () => {
    jest.spyOn(sessions, 'getLastSession').mockResolvedValue(lastSession);
    await renderScreen();

    await waitFor(() => expect(screen.getByText('Continue')).toBeTruthy());
    fireEvent.press(screen.getByRole('button', { name: 'Continue Underwater' }));
    expect(push).toHaveBeenCalledWith({
      pathname: '/session',
      params: { soundId: 'underwater' },
    });
  });

  it('hides the resume card when the remembered sound has left the catalogue', async () => {
    // Sounds the previous build shipped are still in a returning user's storage.
    jest
      .spyOn(sessions, 'getLastSession')
      .mockResolvedValue({ ...lastSession, soundId: 'peaceful-morning' });
    await renderScreen();

    await waitFor(() => expect(screen.queryByText('Continue')).toBeNull());
  });

  it('hides the resume card when the remembered sound has no recording', async () => {
    jest
      .spyOn(sessions, 'getLastSession')
      .mockResolvedValue({ ...lastSession, soundId: 'rain-on-canvas' });
    await renderScreen();

    await waitFor(() => expect(screen.queryByText('Continue')).toBeNull());
  });
});

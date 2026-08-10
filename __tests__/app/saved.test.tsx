import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useEffect } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import SavedScreen from '../../app/(tabs)/saved';
import { SoundStateProvider } from '../../context/SoundStateContext';
import * as soundState from '../../store/soundState';
import { DEFAULT_SOUND_STATE } from '../../store/soundState';
import type { SoundState, SoundStates } from '../../store/soundState';

// This test lives outside `app/` on purpose — Expo Router bundles every file under the app
// directory as a route. See the guard in ./routes.test.ts.

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  // The real hook needs a navigator; running the effect once matches a first focus.
  useFocusEffect: jest.fn(),
}));

const push = jest.fn();
const navigate = jest.fn();

/** The screen's focus effect, held so a test can fire it again as a return would. */
let focus: (() => void) | undefined;

/** Comes back to the screen, the way closing the session does. */
async function refocus() {
  await act(async () => {
    focus?.();
  });
}

/** A saved sound's state, with only the parts a test cares about spelled out. */
function saved(patch: Partial<SoundState> = {}): SoundState {
  return { ...DEFAULT_SOUND_STATE, saved: true, ...patch };
}

function stored(entries: Record<string, Partial<SoundState>>): SoundStates {
  return Object.fromEntries(Object.entries(entries).map(([id, patch]) => [id, saved(patch)]));
}

/** The provider reads storage as it mounts; flushing that read settles the list. */
async function renderScreen() {
  const rendered = render(
    <SoundStateProvider>
      <SavedScreen />
    </SoundStateProvider>
  );
  await act(async () => {});
  return rendered;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(useRouter)
    .mockReturnValue({ push, navigate } as unknown as ReturnType<typeof useRouter>);
  focus = undefined;
  jest.mocked(useFocusEffect).mockImplementation((effect) => {
    // Run once after mount, the way a first focus does, and keep it so a test can fire it
    // again. Calling a hook here is legal: the mock stands in for a hook, so it runs
    // during a component's render.
    focus = effect;
    useEffect(() => effect(), [effect]);
  });
  jest.spyOn(soundState, 'getSoundStates').mockResolvedValue({});
  jest.spyOn(soundState, 'migrateFavourites').mockResolvedValue(undefined);
});

describe('Saved screen', () => {
  it('opens with the screen title and what the list is for', async () => {
    await renderScreen();
    expect(screen.getByRole('heading', { name: 'Saved' })).toBeTruthy();
    expect(screen.getByText('The ones that work for you')).toBeTruthy();
  });

  it('offers a way out rather than a dead end when nothing is saved', async () => {
    await renderScreen();
    expect(screen.getByText('Nothing saved yet')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Browse sounds' })).toBeTruthy();
  });

  it('sends the browse button to the Sounds tab rather than stacking a screen on top', async () => {
    await renderScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Browse sounds' }));
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('holds the empty state back until the read has landed', async () => {
    // A flash of "Nothing saved yet" on every visit would read as a list that had been lost.
    render(
      <SoundStateProvider>
        <SavedScreen />
      </SoundStateProvider>
    );
    expect(screen.queryByTestId('saved-empty')).toBeNull();

    await act(async () => {});
    expect(screen.getByTestId('saved-empty')).toBeTruthy();
  });

  it('lists the saved sounds and nothing else', async () => {
    jest
      .mocked(soundState.getSoundStates)
      .mockResolvedValue(stored({ underwater: {}, 'evening-forest': {} }));
    await renderScreen();

    expect(screen.getByText('Underwater')).toBeTruthy();
    expect(screen.getByText('Evening Forest')).toBeTruthy();
    expect(screen.queryByText('At the Beach')).toBeNull();
    expect(screen.queryByTestId('saved-empty')).toBeNull();
  });

  it('leads with the sound the user reaches for most', async () => {
    jest.mocked(soundState.getSoundStates).mockResolvedValue(
      stored({
        underwater: { sessionCount: 2, lastTimerMinutes: 15 },
        'evening-forest': { sessionCount: 14, lastTimerMinutes: 30 },
      })
    );
    await renderScreen();

    expect(screen.getByText('Your most-played · 30m')).toBeTruthy();
    expect(screen.getByText('2 sessions · 15m')).toBeTruthy();
  });

  it('opens the session for the row that was tapped', async () => {
    jest.mocked(soundState.getSoundStates).mockResolvedValue(stored({ underwater: {} }));
    await renderScreen();

    fireEvent.press(screen.getByTestId('saved-row-underwater'));
    expect(push).toHaveBeenCalledWith({
      pathname: '/session',
      params: { soundId: 'underwater' },
    });
  });

  it('promises the list will play with no signal', async () => {
    jest
      .mocked(soundState.getSoundStates)
      .mockResolvedValue(stored({ underwater: {}, 'evening-forest': {} }));
    await renderScreen();

    expect(screen.getByText('Downloaded for offline')).toBeTruthy();
    expect(screen.getByText(/they play in flight mode/)).toBeTruthy();
  });

  it('makes that promise about one sound in the singular', async () => {
    jest.mocked(soundState.getSoundStates).mockResolvedValue(stored({ underwater: {} }));
    await renderScreen();
    expect(screen.getByText(/it plays in flight mode/)).toBeTruthy();
  });

  it('makes no offline promise about a sound that has no recording to play', async () => {
    jest.mocked(soundState.getSoundStates).mockResolvedValue(stored({ 'rain-on-canvas': {} }));
    await renderScreen();

    expect(screen.getByText('Rain on canvas')).toBeTruthy();
    expect(screen.getByText('Coming soon')).toBeTruthy();
    expect(screen.queryByText('Downloaded for offline')).toBeNull();
  });

  it('leaves out a sound whose star the user has since cleared', async () => {
    jest.mocked(soundState.getSoundStates).mockResolvedValue({
      underwater: saved(),
      'at-the-beach': { ...DEFAULT_SOUND_STATE, saved: false, sessionCount: 9 },
    });
    await renderScreen();

    expect(screen.getByText('Underwater')).toBeTruthy();
    expect(screen.queryByText('At the Beach')).toBeNull();
  });

  it('drops a saved sound that has left the catalogue', async () => {
    // Sounds an earlier build shipped are still in a returning user's storage.
    jest
      .mocked(soundState.getSoundStates)
      .mockResolvedValue(stored({ 'peaceful-morning': { sessionCount: 4 } }));
    await renderScreen();

    expect(screen.getByTestId('saved-empty')).toBeTruthy();
  });

  it('picks up the session the user just finished', async () => {
    // The session writes its count and timer on the way out without going through the
    // context, so these numbers are only right if the screen reads them again on focus.
    const read = jest
      .mocked(soundState.getSoundStates)
      .mockResolvedValue(stored({ underwater: { sessionCount: 2, lastTimerMinutes: 45 } }));
    await renderScreen();
    expect(screen.getByText('2 sessions · 45m')).toBeTruthy();

    read.mockResolvedValue(stored({ underwater: { sessionCount: 3, lastTimerMinutes: 30 } }));
    await refocus();

    expect(screen.getByText('3 sessions · 30m')).toBeTruthy();
  });

  it('re-orders itself when a session changes which sound is played most', async () => {
    const read = jest.mocked(soundState.getSoundStates).mockResolvedValue(
      stored({
        underwater: { sessionCount: 5, lastTimerMinutes: 45 },
        'evening-forest': { sessionCount: 4, lastTimerMinutes: 30 },
      })
    );
    await renderScreen();
    expect(screen.getByText('Your most-played · 45m')).toBeTruthy();

    read.mockResolvedValue(
      stored({
        underwater: { sessionCount: 5, lastTimerMinutes: 45 },
        'evening-forest': { sessionCount: 6, lastTimerMinutes: 30 },
      })
    );
    await refocus();

    expect(screen.getByText('Your most-played · 30m')).toBeTruthy();
    expect(screen.getByText('5 sessions · 45m')).toBeTruthy();
  });
});

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createAudioPlayer } from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import SessionRoute from '../../app/session';
import { SoundStateProvider } from '../../context/SoundStateContext';
import * as sessions from '../../store/sessions';
import * as settings from '../../store/settings';
import * as soundState from '../../store/soundState';
import { DEFAULT_SETTINGS } from '../../store/settings';
import { DEFAULT_SOUND_STATE } from '../../store/soundState';

// This test lives outside `app/` on purpose — Expo Router bundles every file under the app
// directory as a route. See the guard in ./routes.test.ts.

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));

const back = jest.fn();
const dismissTo = jest.fn();

type Player = {
  loop: boolean;
  volume: number;
  play: jest.Mock;
  pause: jest.Mock;
  remove: jest.Mock;
};

let player: Player;

const MINUTE = 60 * 1000;

/** The provider and the settings read both land on mount; flushing them starts playback. */
async function renderSession(soundId = 'underwater') {
  jest.mocked(useLocalSearchParams).mockReturnValue({ soundId });
  const rendered = render(
    <SoundStateProvider>
      <SessionRoute />
    </SoundStateProvider>
  );
  await act(async () => {});
  return rendered;
}

/** The interval the clock refreshes on. */
const TICK = 1000;

/**
 * Moves time on by `ms`.
 *
 * The clock reads elapsed time off `Date.now()` rather than counting ticks, so this jumps
 * the system clock and fires a single tick. Advancing tick by tick would re-render the
 * whole screen once per second — 2,700 times for a 45 minute timer.
 */
function advance(ms: number) {
  act(() => {
    jest.setSystemTime(Date.now() + ms - TICK);
    jest.advanceTimersByTime(TICK);
  });
}

function transport() {
  return screen.getByTestId('transport-button');
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();

  player = { loop: false, volume: 0, play: jest.fn(), pause: jest.fn(), remove: jest.fn() };
  jest
    .mocked(createAudioPlayer)
    .mockImplementation(() => player as unknown as ReturnType<typeof createAudioPlayer>);

  jest.mocked(useRouter).mockReturnValue({ back, dismissTo } as unknown as ReturnType<
    typeof useRouter
  >);

  jest.spyOn(settings, 'getSettings').mockResolvedValue(DEFAULT_SETTINGS);
  jest.spyOn(soundState, 'getSoundStates').mockResolvedValue({});
  // The provider migrates the pre-redesign favourites before its first read. That is not
  // what these tests are about, and it reaches real storage on every one of them.
  jest.spyOn(soundState, 'migrateFavourites').mockResolvedValue(undefined);
  jest.spyOn(soundState, 'recordSession').mockResolvedValue(DEFAULT_SOUND_STATE);
  jest.spyOn(soundState, 'toggleSaved').mockResolvedValue(true);
  jest.spyOn(sessions, 'setLastSession').mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('Session screen', () => {
  it('names the sound and how it behaves', async () => {
    await renderSession();
    expect(screen.getByText('Underwater')).toBeTruthy();
    expect(screen.getByText('Low-pass · deep')).toBeTruthy();
  });

  it('starts playing as soon as it opens', async () => {
    await renderSession();
    expect(player.play).toHaveBeenCalled();
    expect(player.loop).toBe(true);
    expect(transport().props.accessibilityLabel).toBe('Pause');
  });

  it('opens on a clock at zero and the full timer remaining', async () => {
    await renderSession();
    expect(screen.getByText('0:00')).toBeTruthy();
    expect(screen.getByText('45:00 left')).toBeTruthy();
  });

  it('counts the clock up and the timer down as it plays', async () => {
    await renderSession();
    advance(90 * 1000);
    expect(screen.getByText('1:30')).toBeTruthy();
    expect(screen.getByText('43:30 left')).toBeTruthy();
  });

  it('pauses the sound and holds the clock where it was', async () => {
    await renderSession();
    advance(30 * 1000);

    fireEvent.press(transport());
    expect(player.pause).toHaveBeenCalled();
    expect(transport().props.accessibilityLabel).toBe('Play');

    advance(5 * MINUTE);
    expect(screen.getByText('0:30')).toBeTruthy();
  });

  it('resumes from where it paused rather than starting over', async () => {
    await renderSession();
    advance(30 * 1000);
    fireEvent.press(transport());
    advance(5 * MINUTE);
    fireEvent.press(transport());
    advance(10 * 1000);

    expect(screen.getByText('0:40')).toBeTruthy();
    expect(player.play).toHaveBeenCalledTimes(2);
  });

  it('pauses itself rather than vanishing when the timer runs out', async () => {
    // Whoever set a timer is probably asleep. A screen that dismissed itself would leave
    // them with no idea what happened.
    await renderSession();
    advance(45 * MINUTE);

    expect(transport().props.accessibilityLabel).toBe('Play');
    expect(screen.getByText('0:00 left')).toBeTruthy();
  });

  it('starts a fresh stretch when play is pressed after the timer ran out', async () => {
    // Resuming a session with nothing left on it would play at zero volume, because the
    // fade has already taken it there.
    await renderSession();
    advance(45 * MINUTE);
    expect(player.volume).toBe(0);

    fireEvent.press(transport());
    expect(screen.getByText('45:00 left')).toBeTruthy();
    expect(screen.getByText('0:00')).toBeTruthy();
    expect(player.volume).toBe(DEFAULT_SOUND_STATE.lastVolume);
  });

  it('changes the timer without interrupting the sound', async () => {
    await renderSession();
    advance(60 * 1000);
    fireEvent.press(screen.getByRole('button', { name: '15 minutes' }));

    expect(screen.getByText('14:00 left')).toBeTruthy();
    expect(player.pause).not.toHaveBeenCalled();
  });

  it('drops the countdown for a session with no timer', async () => {
    await renderSession();
    fireEvent.press(screen.getByRole('button', { name: 'No timer' }));

    expect(screen.getByText('No timer')).toBeTruthy();
    advance(90 * MINUTE);
    expect(screen.getByText('1:30:00')).toBeTruthy();
  });

  it('follows the volume slider without interrupting playback', async () => {
    await renderSession();
    fireEvent(screen.getByTestId('volume-slider'), 'valueChange', 0.25);

    expect(player.volume).toBe(0.25);
    expect(player.pause).not.toHaveBeenCalled();
  });

  it('opens at the volume and timer this sound last used', async () => {
    jest.spyOn(soundState, 'getSoundStates').mockResolvedValue({
      underwater: {
        ...DEFAULT_SOUND_STATE,
        lastVolume: 0.4,
        lastTimerMinutes: 30,
        sessionCount: 6,
      },
    });
    await renderSession();

    expect(player.volume).toBe(0.4);
    expect(screen.getByText('30:00 left')).toBeTruthy();
  });

  it('saves the sound from the session, not only from the grid', async () => {
    await renderSession();
    const star = screen.getByTestId('session-saved-star');
    expect(star.props.accessibilityLabel).toBe('Save Underwater');

    await act(async () => {
      fireEvent.press(star);
    });
    expect(screen.getByTestId('session-saved-star').props.accessibilityLabel).toBe(
      'Remove Underwater from saved'
    );
  });

  it('closes back to where it was opened from', async () => {
    await renderSession();
    fireEvent.press(screen.getByRole('button', { name: 'Close session' }));
    expect(back).toHaveBeenCalled();
  });

  it('hands over to the Sleep screen rather than stacking it on top of the session', async () => {
    await renderSession();
    fireEvent.press(screen.getByRole('button', { name: 'Wind down for the night' }));
    expect(dismissTo).toHaveBeenCalledWith('/sleep');
  });

  it('remembers the session on the way out', async () => {
    await renderSession();
    advance(20 * MINUTE);
    fireEvent(screen.getByTestId('volume-slider'), 'valueChange', 0.55);

    screen.unmount();

    expect(soundState.recordSession).toHaveBeenCalledWith('underwater', {
      volume: 0.55,
      timerMinutes: 45,
    });
    expect(sessions.setLastSession).toHaveBeenCalledWith(
      expect.objectContaining({ soundId: 'underwater', durationMinutes: 20, timerMinutes: 45 })
    );
  });

  it('remembers a session that was swiped away as well as one that was closed', async () => {
    // The screen is a sheet, so there is no close handler to hang this off.
    await renderSession();
    advance(10 * MINUTE);
    screen.unmount();
    expect(sessions.setLastSession).toHaveBeenCalled();
  });

  it('does not remember a session nobody listened to', async () => {
    // Opening the wrong sound and backing straight out would otherwise push the real
    // last session off the resume card.
    await renderSession();
    advance(5 * 1000);
    screen.unmount();

    expect(soundState.recordSession).not.toHaveBeenCalled();
    expect(sessions.setLastSession).not.toHaveBeenCalled();
  });

  it('releases the player when it closes', async () => {
    await renderSession();
    screen.unmount();
    expect(player.remove).toHaveBeenCalled();
  });

  it('says so rather than pretending to play a sound with no recording', async () => {
    await renderSession('rain-on-canvas');

    expect(screen.getByText('Rain on canvas')).toBeTruthy();
    expect(screen.getByText('No recording for this one yet')).toBeTruthy();
    expect(transport().props.accessibilityState).toMatchObject({ disabled: true });
    expect(transport().props.accessibilityLabel).toBe('Play');
    expect(createAudioPlayer).not.toHaveBeenCalled();
  });

  it('leaves the clock at zero for a sound with no recording', async () => {
    await renderSession('rain-on-canvas');
    advance(20 * MINUTE);
    expect(screen.getByText('0:00')).toBeTruthy();
  });

  it('does not remember a silent session as one that played', async () => {
    await renderSession('rain-on-canvas');
    advance(20 * MINUTE);
    screen.unmount();

    expect(soundState.recordSession).not.toHaveBeenCalled();
    expect(sessions.setLastSession).not.toHaveBeenCalled();
  });

  it('handles a link to a sound that is not in this build', async () => {
    await renderSession('peaceful-morning');

    expect(screen.getByText('Nothing to play')).toBeTruthy();
    expect(screen.queryByTestId('transport-button')).toBeNull();
    expect(screen.getByRole('button', { name: 'Close session' })).toBeTruthy();
  });
});

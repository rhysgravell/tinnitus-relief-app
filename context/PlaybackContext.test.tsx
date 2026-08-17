import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { PlaybackProvider, usePlayback } from './PlaybackContext';
import { SettingsProvider } from './SettingsContext';
import { SoundStateProvider } from './SoundStateContext';
import * as sessions from '../store/sessions';
import * as settings from '../store/settings';
import * as soundState from '../store/soundState';
import { DEFAULT_SETTINGS } from '../store/settings';
import { DEFAULT_SOUND_STATE } from '../store/soundState';

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));

type Player = {
  loop: boolean;
  volume: number;
  play: jest.Mock;
  pause: jest.Mock;
  remove: jest.Mock;
};

let players: Player[];

const MINUTE = 60 * 1000;

/** The interval the clock refreshes on. */
const TICK = 1000;

/** A probe that reports the transport back through the tree, and can work it. */
function Probe() {
  const {
    sound,
    playing,
    silent,
    volume,
    setVolume,
    timerMinutes,
    setTimerMinutes,
    elapsedSeconds,
    open,
    toggle,
    stop,
  } = usePlayback();

  return (
    <>
      <Text testID="sound">{sound ? sound.id : 'nothing'}</Text>
      <Text testID="playing">{String(playing)}</Text>
      <Text testID="silent">{String(silent)}</Text>
      <Text testID="volume">{String(volume)}</Text>
      <Text testID="timer">{String(timerMinutes)}</Text>
      <Text testID="elapsed">{String(elapsedSeconds)}</Text>
      <Pressable testID="open-underwater" onPress={() => open('underwater')}>
        <Text>underwater</Text>
      </Pressable>
      <Pressable testID="open-beach" onPress={() => open('at-the-beach')}>
        <Text>beach</Text>
      </Pressable>
      <Pressable testID="open-rain" onPress={() => open('rain-on-canvas')}>
        <Text>rain</Text>
      </Pressable>
      <Pressable testID="quieter" onPress={() => setVolume(0.15)}>
        <Text>quieter</Text>
      </Pressable>
      <Pressable testID="shorter" onPress={() => setTimerMinutes(15)}>
        <Text>shorter</Text>
      </Pressable>
      <Pressable testID="toggle" onPress={toggle}>
        <Text>toggle</Text>
      </Pressable>
      <Pressable testID="stop" onPress={stop}>
        <Text>stop</Text>
      </Pressable>
    </>
  );
}

/** The settings and sound state reads both land on mount; flushing them settles the tree. */
async function renderPlayback() {
  const rendered = render(
    <SettingsProvider>
      <SoundStateProvider>
        <PlaybackProvider>
          <Probe />
        </PlaybackProvider>
      </SoundStateProvider>
    </SettingsProvider>
  );
  await act(async () => {});
  return rendered;
}

function value(testID: string) {
  return screen.getByTestId(testID).props.children;
}

/** Moves time on by `ms`. The clock reads it off `Date.now()`, so one tick is enough. */
function advance(ms: number) {
  act(() => {
    jest.setSystemTime(Date.now() + ms - TICK);
    jest.advanceTimersByTime(TICK);
  });
}

/** The most recently created player, which is the one currently loaded. */
function player(): Player {
  return players[players.length - 1];
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();

  players = [];
  jest.mocked(createAudioPlayer).mockImplementation(() => {
    const made: Player = { loop: false, volume: 0, play: jest.fn(), pause: jest.fn(), remove: jest.fn() };
    players.push(made);
    return made as unknown as ReturnType<typeof createAudioPlayer>;
  });

  jest.spyOn(settings, 'getSettings').mockResolvedValue(DEFAULT_SETTINGS);
  jest.spyOn(soundState, 'getSoundStates').mockResolvedValue({});
  jest.spyOn(soundState, 'migrateFavourites').mockResolvedValue(undefined);
  jest.spyOn(soundState, 'recordSession').mockResolvedValue(DEFAULT_SOUND_STATE);
  jest.spyOn(sessions, 'addSession').mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('PlaybackProvider', () => {
  it('plays nothing until it is asked for something', async () => {
    await renderPlayback();

    expect(value('sound')).toBe('nothing');
    expect(createAudioPlayer).not.toHaveBeenCalled();
  });

  it('leaves the phone alone until there is something to play', async () => {
    // It mounts with the app, long before anyone opens a session. Claiming the audio
    // session at launch would duck or interrupt whatever was already playing.
    await renderPlayback();
    expect(setAudioModeAsync).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('open-underwater'));
    expect(setAudioModeAsync).toHaveBeenCalled();
  });

  it('starts the sound it is asked for', async () => {
    await renderPlayback();
    fireEvent.press(screen.getByTestId('open-underwater'));

    expect(value('sound')).toBe('underwater');
    expect(value('playing')).toBe('true');
    expect(player().play).toHaveBeenCalled();
    expect(player().loop).toBe(true);
  });

  it('leaves a sound already playing alone when it is asked for again', async () => {
    // Coming back to a session handed over to the wind-down routine. Restarting it would
    // lose the clock and drop the sound for a moment.
    await renderPlayback();
    fireEvent.press(screen.getByTestId('open-underwater'));
    advance(10 * MINUTE);
    fireEvent.press(screen.getByTestId('open-underwater'));

    expect(value('elapsed')).toBe('600');
    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
  });

  it('starts a new session when a different sound is opened', async () => {
    await renderPlayback();
    fireEvent.press(screen.getByTestId('open-underwater'));
    advance(10 * MINUTE);
    fireEvent.press(screen.getByTestId('open-beach'));

    expect(value('sound')).toBe('at-the-beach');
    expect(value('elapsed')).toBe('0');
    expect(players).toHaveLength(2);
    expect(players[0].remove).toHaveBeenCalled();
  });

  it('logs the session the swapped-away sound had run', async () => {
    await renderPlayback();
    fireEvent.press(screen.getByTestId('open-underwater'));
    advance(10 * MINUTE);
    fireEvent.press(screen.getByTestId('open-beach'));

    expect(sessions.addSession).toHaveBeenCalledWith(
      expect.objectContaining({ soundId: 'underwater', durationMinutes: 10 })
    );
  });

  it('forgets the sound and releases the player when it is stopped', async () => {
    await renderPlayback();
    fireEvent.press(screen.getByTestId('open-underwater'));
    advance(10 * MINUTE);
    const first = player();
    fireEvent.press(screen.getByTestId('stop'));

    expect(value('sound')).toBe('nothing');
    expect(first.remove).toHaveBeenCalled();
    expect(sessions.addSession).toHaveBeenCalledTimes(1);
  });

  it('pauses and resumes without losing the clock', async () => {
    await renderPlayback();
    fireEvent.press(screen.getByTestId('open-underwater'));
    advance(30 * 1000);
    fireEvent.press(screen.getByTestId('toggle'));
    advance(5 * MINUTE);

    expect(value('playing')).toBe('false');
    expect(value('elapsed')).toBe('30');
    expect(player().pause).toHaveBeenCalled();
  });

  it('carries no chosen volume or timer over to the next sound', async () => {
    // The pair belong to the sound they were set for. Left standing, the beach would open
    // at the level chosen to sit under the ringing with something else playing.
    await renderPlayback();
    fireEvent.press(screen.getByTestId('open-underwater'));
    fireEvent.press(screen.getByTestId('quieter'));
    fireEvent.press(screen.getByTestId('shorter'));
    expect(value('volume')).toBe('0.15');
    expect(value('timer')).toBe('15');

    fireEvent.press(screen.getByTestId('open-beach'));

    expect(value('volume')).toBe(String(DEFAULT_SOUND_STATE.lastVolume));
    expect(value('timer')).toBe(String(DEFAULT_SETTINGS.defaultTimerMinutes));
  });

  it('says a sound with no recording is silent rather than pretending to play it', async () => {
    await renderPlayback();
    fireEvent.press(screen.getByTestId('open-rain'));

    expect(value('sound')).toBe('rain-on-canvas');
    expect(value('silent')).toBe('true');
    expect(createAudioPlayer).not.toHaveBeenCalled();
  });
});

describe('usePlayback', () => {
  it('throws outside a provider rather than handing back a dead transport', () => {
    // A play button that silently did nothing would look like a broken sound file.
    const quiet = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow('usePlayback must be used inside a PlaybackProvider');
    quiet.mockRestore();
  });
});

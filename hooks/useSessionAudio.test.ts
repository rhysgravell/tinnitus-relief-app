import { act, renderHook } from '@testing-library/react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { FADE_SECONDS, fadeMultiplier, useSessionAudio } from './useSessionAudio';

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

function fakePlayer(): Player {
  return { loop: false, volume: 0, play: jest.fn(), pause: jest.fn(), remove: jest.fn() };
}

type Options = Parameters<typeof useSessionAudio>[0];

const SOURCE = 42 as unknown as Options['source'];

function setup(options: Partial<Options> = {}) {
  const initial: Options = {
    source: SOURCE,
    playing: true,
    volume: 0.6,
    remainingSeconds: 600,
    fadeOut: false,
    mixWithOthers: false,
    ...options,
  };
  const rendered = renderHook((props: Options) => useSessionAudio(props), {
    initialProps: initial,
  });
  return { ...rendered, initial };
}

let player: Player;

beforeEach(() => {
  jest.clearAllMocks();
  player = fakePlayer();
  jest.mocked(createAudioPlayer).mockImplementation(() => player as unknown as ReturnType<typeof createAudioPlayer>);
});

describe('fadeMultiplier', () => {
  it('leaves the volume alone with the fade off', () => {
    expect(fadeMultiplier(5, false)).toBe(1);
  });

  it('leaves the volume alone on the infinite timer, which has no end to fade into', () => {
    expect(fadeMultiplier(null, true)).toBe(1);
  });

  it('leaves the volume alone until the fade window opens', () => {
    expect(fadeMultiplier(FADE_SECONDS + 1, true)).toBe(1);
    expect(fadeMultiplier(FADE_SECONDS, true)).toBe(1);
  });

  it('ramps down across the fade window', () => {
    expect(fadeMultiplier(FADE_SECONDS - 15, true)).toBeCloseTo(0.5);
    expect(fadeMultiplier(3, true)).toBeCloseTo(0.1);
    expect(fadeMultiplier(0, true)).toBe(0);
  });

  it('does not go negative past the end', () => {
    expect(fadeMultiplier(-5, true)).toBe(0);
  });
});

describe('useSessionAudio', () => {
  it('creates one looping player for the sound', () => {
    setup();
    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
    expect(createAudioPlayer).toHaveBeenCalledWith(SOURCE);
    expect(player.loop).toBe(true);
  });

  it('starts playing at the chosen volume', () => {
    setup({ volume: 0.42 });
    expect(player.volume).toBe(0.42);
    expect(player.play).toHaveBeenCalled();
  });

  it('does not create a player for a sound with no recording', () => {
    const { result } = setup({ source: null });
    expect(createAudioPlayer).not.toHaveBeenCalled();
    expect(result.current.silent).toBe(true);
  });

  it('reports silence when the player cannot be created', () => {
    jest.mocked(createAudioPlayer).mockImplementation(() => {
      throw new Error('asset missing');
    });
    const { result } = setup();
    expect(result.current.silent).toBe(true);
  });

  it('plays without complaint when the asset is there', () => {
    const { result } = setup();
    expect(result.current.silent).toBe(false);
  });

  it('pauses and resumes the same player rather than making a new one', () => {
    const { rerender, initial } = setup();
    rerender({ ...initial, playing: false });
    expect(player.pause).toHaveBeenCalledTimes(1);

    rerender({ ...initial, playing: true });
    expect(player.play).toHaveBeenCalledTimes(2);
    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
  });

  it('follows the volume without interrupting playback', () => {
    const { rerender, initial } = setup();
    rerender({ ...initial, volume: 0.9 });
    expect(player.volume).toBe(0.9);
    expect(player.pause).not.toHaveBeenCalled();
  });

  it('fades the last seconds of a timed session down to nothing', () => {
    const { rerender, initial } = setup({ fadeOut: true, volume: 0.8, remainingSeconds: 60 });
    expect(player.volume).toBe(0.8);

    rerender({ ...initial, fadeOut: true, volume: 0.8, remainingSeconds: 15 });
    expect(player.volume).toBeCloseTo(0.4);

    rerender({ ...initial, fadeOut: true, volume: 0.8, remainingSeconds: 0 });
    expect(player.volume).toBe(0);
  });

  it('keeps the slider level intact while the fade runs', () => {
    // The fade is applied to the player, never to the chosen volume — otherwise the
    // slider would crawl to zero on its own and the level would be lost for next time.
    const { rerender, initial } = setup({ fadeOut: true, volume: 0.8, remainingSeconds: 15 });
    rerender({ ...initial, fadeOut: true, volume: 0.8, remainingSeconds: 600 });
    expect(player.volume).toBe(0.8);
  });

  it('keeps playing while the screen is locked and over other audio when asked to', () => {
    setup({ mixWithOthers: true });
    expect(setAudioModeAsync).toHaveBeenCalledWith({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'mixWithOthers',
    });
  });

  it('ducks other audio by default', () => {
    setup();
    expect(setAudioModeAsync).toHaveBeenCalledWith(
      expect.objectContaining({ interruptionMode: 'duckOthers' })
    );
  });

  it('claims no audio session while there is nothing to play', () => {
    // This runs for the whole life of the app, not just while a session is open. Setting
    // the mode at launch would duck whatever the phone was already playing.
    setup({ source: null });
    expect(setAudioModeAsync).not.toHaveBeenCalled();
  });

  it('survives an audio mode that the platform rejects', () => {
    jest.mocked(setAudioModeAsync).mockRejectedValue(new Error('no session'));
    const { result } = setup();
    expect(result.current.silent).toBe(false);
  });

  it('releases the player when the session closes', () => {
    const { unmount } = setup();
    unmount();
    expect(player.remove).toHaveBeenCalledTimes(1);
  });

  it('swaps the player when the sound changes', () => {
    const { rerender, initial } = setup();
    const second = fakePlayer();
    jest.mocked(createAudioPlayer).mockImplementation(() => second as unknown as ReturnType<typeof createAudioPlayer>);

    act(() => {
      rerender({ ...initial, source: 7 as unknown as Options['source'] });
    });

    expect(player.remove).toHaveBeenCalledTimes(1);
    expect(second.play).toHaveBeenCalled();
  });
});

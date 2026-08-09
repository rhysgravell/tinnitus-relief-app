import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { SoundStateProvider, useSoundStates } from './SoundStateContext';
import * as store from '../store/soundState';

/** A probe that reports the context back through the tree. */
function Probe({ id = 'underwater' }: { id?: string }) {
  const { ready, stateFor, toggleSaved } = useSoundStates();

  return (
    <>
      <Text testID="ready">{String(ready)}</Text>
      <Text testID="saved">{String(stateFor(id).saved)}</Text>
      <Text testID="timer">{String(stateFor(id).lastTimerMinutes)}</Text>
      <Pressable testID="toggle" onPress={() => toggleSaved(id)}>
        <Text>toggle</Text>
      </Pressable>
    </>
  );
}

function value(testID: string) {
  return screen.getByTestId(testID).props.children;
}

beforeEach(() => {
  jest.restoreAllMocks();
});

describe('SoundStateProvider', () => {
  it('reports itself ready once storage has answered', async () => {
    jest.spyOn(store, 'getSoundStates').mockResolvedValue({});
    render(
      <SoundStateProvider>
        <Probe />
      </SoundStateProvider>
    );

    expect(value('ready')).toBe('false');
    await waitFor(() => expect(value('ready')).toBe('true'));
  });

  it('exposes what storage held', async () => {
    jest.spyOn(store, 'getSoundStates').mockResolvedValue({
      underwater: { ...store.DEFAULT_SOUND_STATE, saved: true },
    });
    render(
      <SoundStateProvider>
        <Probe />
      </SoundStateProvider>
    );

    await waitFor(() => expect(value('saved')).toBe('true'));
  });

  it('falls back to the defaults for a sound the user has never opened', async () => {
    jest.spyOn(store, 'getSoundStates').mockResolvedValue({});
    render(
      <SoundStateProvider>
        <Probe id="never-touched" />
      </SoundStateProvider>
    );

    await waitFor(() => expect(value('ready')).toBe('true'));
    expect(value('saved')).toBe('false');
    expect(value('timer')).toBe(String(store.DEFAULT_SOUND_STATE.lastTimerMinutes));
  });

  it('flips the star before the write lands', async () => {
    // The star has to answer the tap, not the disk, so the flip happens in memory first.
    jest.spyOn(store, 'getSoundStates').mockResolvedValue({});
    // A write that never settles: whatever the star shows now, it is not from storage.
    jest.spyOn(store, 'toggleSaved').mockReturnValue(new Promise<boolean>(() => {}));

    render(
      <SoundStateProvider>
        <Probe />
      </SoundStateProvider>
    );
    await waitFor(() => expect(value('ready')).toBe('true'));

    fireEvent.press(screen.getByTestId('toggle'));

    expect(value('saved')).toBe('true');
  });

  it('persists the toggle', async () => {
    jest.spyOn(store, 'getSoundStates').mockResolvedValue({});
    jest.spyOn(store, 'toggleSaved').mockResolvedValue(true);

    render(
      <SoundStateProvider>
        <Probe />
      </SoundStateProvider>
    );
    await waitFor(() => expect(value('ready')).toBe('true'));

    fireEvent.press(screen.getByTestId('toggle'));

    await waitFor(() => expect(store.toggleSaved).toHaveBeenCalledWith('underwater'));
  });

  it('toggles back off again', async () => {
    jest.spyOn(store, 'getSoundStates').mockResolvedValue({
      underwater: { ...store.DEFAULT_SOUND_STATE, saved: true },
    });
    jest.spyOn(store, 'toggleSaved').mockResolvedValue(false);

    render(
      <SoundStateProvider>
        <Probe />
      </SoundStateProvider>
    );
    await waitFor(() => expect(value('saved')).toBe('true'));

    fireEvent.press(screen.getByTestId('toggle'));

    expect(value('saved')).toBe('false');
  });
});

describe('useSoundStates', () => {
  it('throws outside a provider rather than dropping the tap', () => {
    // A silent no-op would look like it saved and lose the state.
    const quiet = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/SoundStateProvider/);
    quiet.mockRestore();
  });
});

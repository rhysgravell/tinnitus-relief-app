import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { SoundStateProvider, useSoundStates } from './SoundStateContext';
import * as store from '../store/soundState';

/** A probe that reports the context back through the tree. */
function Probe({ id = 'underwater' }: { id?: string }) {
  const { ready, stateFor, toggleSaved, refresh } = useSoundStates();

  return (
    <>
      <Text testID="ready">{String(ready)}</Text>
      <Text testID="saved">{String(stateFor(id).saved)}</Text>
      <Text testID="timer">{String(stateFor(id).lastTimerMinutes)}</Text>
      <Text testID="sessions">{String(stateFor(id).sessionCount)}</Text>
      <Pressable testID="toggle" onPress={() => toggleSaved(id)}>
        <Text>toggle</Text>
      </Pressable>
      <Pressable testID="refresh" onPress={() => refresh()}>
        <Text>refresh</Text>
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

  it('picks up what another screen wrote when asked to refresh', async () => {
    // The session records its count and timer straight to storage as it closes, so a
    // screen showing those numbers has to ask for them again.
    const read = jest.spyOn(store, 'getSoundStates').mockResolvedValue({});
    render(
      <SoundStateProvider>
        <Probe />
      </SoundStateProvider>
    );
    await waitFor(() => expect(value('ready')).toBe('true'));

    read.mockResolvedValue({
      underwater: { ...store.DEFAULT_SOUND_STATE, sessionCount: 15, lastTimerMinutes: 30 },
    });
    fireEvent.press(screen.getByTestId('refresh'));

    await waitFor(() => expect(value('sessions')).toBe('15'));
    expect(value('timer')).toBe('30');
  });

  it('does not let a refresh undo a star whose write is still in the air', async () => {
    // Tapping a star and switching tabs puts a read and a write in flight together. The
    // read cannot see the tap, so letting it win would silently drop the star.
    const read = jest.spyOn(store, 'getSoundStates').mockResolvedValue({});
    jest.spyOn(store, 'toggleSaved').mockReturnValue(new Promise<boolean>(() => {}));

    render(
      <SoundStateProvider>
        <Probe />
      </SoundStateProvider>
    );
    await waitFor(() => expect(value('ready')).toBe('true'));

    fireEvent.press(screen.getByTestId('toggle'));
    expect(value('saved')).toBe('true');

    // What storage still holds: the write has not landed.
    read.mockResolvedValue({});
    fireEvent.press(screen.getByTestId('refresh'));
    await waitFor(() => expect(read).toHaveBeenCalledTimes(2));

    expect(value('saved')).toBe('true');
  });

  it('carries the old favourites over before the first read', async () => {
    // The other way round and the first paint would show a returning user an empty list.
    const order: string[] = [];
    jest.spyOn(store, 'migrateFavourites').mockImplementation(async () => {
      order.push('migrate');
    });
    jest.spyOn(store, 'getSoundStates').mockImplementation(async () => {
      order.push('read');
      return {};
    });

    render(
      <SoundStateProvider>
        <Probe />
      </SoundStateProvider>
    );
    await waitFor(() => expect(value('ready')).toBe('true'));

    expect(order).toEqual(['migrate', 'read']);
  });

  it('opens anyway when the old favourites cannot be carried over', async () => {
    // The migration writes, and a write can fail. A provider that never became ready would
    // leave Saved blank and every star on Sounds hollow, for the sake of one lost carry-over
    // the next launch will retry.
    jest.spyOn(store, 'migrateFavourites').mockRejectedValue(new Error('disk full'));
    jest.spyOn(store, 'getSoundStates').mockResolvedValue({
      underwater: { ...store.DEFAULT_SOUND_STATE, saved: true },
    });

    render(
      <SoundStateProvider>
        <Probe />
      </SoundStateProvider>
    );

    await waitFor(() => expect(value('ready')).toBe('true'));
    expect(value('saved')).toBe('true');
  });

  it('keeps the star where the tap put it when the write fails', async () => {
    // There is nothing useful to tell someone at 3am about a write that did not land, and
    // an error thrown out of the tap handler would be a rejection nobody is listening for.
    jest.spyOn(store, 'getSoundStates').mockResolvedValue({});
    jest.spyOn(store, 'toggleSaved').mockRejectedValue(new Error('disk full'));

    render(
      <SoundStateProvider>
        <Probe />
      </SoundStateProvider>
    );
    await waitFor(() => expect(value('ready')).toBe('true'));

    await act(async () => {
      fireEvent.press(screen.getByTestId('toggle'));
    });

    expect(value('saved')).toBe('true');
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

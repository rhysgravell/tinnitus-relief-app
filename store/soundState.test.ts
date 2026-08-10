import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_SOUND_STATE,
  getSavedIds,
  getSoundState,
  migrateFavourites,
  recordSession,
  toggleSaved,
} from './soundState';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('sound state', () => {
  it('falls back to the defaults for a sound never opened', async () => {
    expect(await getSoundState('underwater')).toEqual(DEFAULT_SOUND_STATE);
  });

  it('saves a sound on first toggle', async () => {
    expect(await toggleSaved('underwater')).toBe(true);
    expect((await getSoundState('underwater')).saved).toBe(true);
  });

  it('unsaves on second toggle', async () => {
    await toggleSaved('underwater');
    expect(await toggleSaved('underwater')).toBe(false);
    expect((await getSoundState('underwater')).saved).toBe(false);
  });

  it('lists only saved ids', async () => {
    await toggleSaved('underwater');
    await toggleSaved('at-the-beach');
    await toggleSaved('underwater');
    expect(await getSavedIds()).toEqual(['at-the-beach']);
  });

  it('remembers the volume and timer from a session', async () => {
    await recordSession('underwater', { volume: 0.42, timerMinutes: 30 });
    const state = await getSoundState('underwater');
    expect(state.lastVolume).toBe(0.42);
    expect(state.lastTimerMinutes).toBe(30);
  });

  it('stores a null timer for a session with no timer', async () => {
    await recordSession('underwater', { volume: 0.5, timerMinutes: null });
    expect((await getSoundState('underwater')).lastTimerMinutes).toBeNull();
  });

  it('counts each session', async () => {
    await recordSession('underwater', { volume: 0.5, timerMinutes: 45 });
    const state = await recordSession('underwater', { volume: 0.5, timerMinutes: 45 });
    expect(state.sessionCount).toBe(2);
  });

  it('keeps a sound saved across sessions', async () => {
    // Recording a session patches the same entry, so it must not clear the star.
    await toggleSaved('underwater');
    await recordSession('underwater', { volume: 0.5, timerMinutes: 45 });
    expect((await getSoundState('underwater')).saved).toBe(true);
  });

  it('keeps sounds independent of one another', async () => {
    await recordSession('underwater', { volume: 0.42, timerMinutes: 15 });
    expect(await getSoundState('at-the-beach')).toEqual(DEFAULT_SOUND_STATE);
  });
});

describe('migrating the old favourites', () => {
  /** How the app stored favourites before the redesign: a flat list of ids. */
  async function storeLegacy(ids: string[]) {
    await AsyncStorage.setItem('favourites', JSON.stringify(ids));
  }

  it('carries an old favourite over as a saved sound', async () => {
    await storeLegacy(['underwater']);
    await migrateFavourites();
    expect((await getSoundState('underwater')).saved).toBe(true);
  });

  it('carries every one of them over', async () => {
    await storeLegacy(['underwater', 'at-the-beach', 'evening-forest']);
    await migrateFavourites();
    expect((await getSavedIds()).sort()).toEqual(['at-the-beach', 'evening-forest', 'underwater']);
  });

  it('drops the old list once it has been carried over', async () => {
    // Which is also what stops the migration running twice: there is no flag to keep.
    await storeLegacy(['underwater']);
    await migrateFavourites();
    expect(await AsyncStorage.getItem('favourites')).toBeNull();
  });

  it('cannot resurrect a sound the user has since unsaved', async () => {
    await storeLegacy(['underwater']);
    await migrateFavourites();
    await toggleSaved('underwater');

    await migrateFavourites();
    expect((await getSoundState('underwater')).saved).toBe(false);
  });

  it('skips a favourite that has left the catalogue', async () => {
    // Nothing can show it, so state against its id would just sit there.
    await storeLegacy(['peaceful-morning', 'underwater']);
    await migrateFavourites();
    expect(await getSavedIds()).toEqual(['underwater']);
  });

  it('leaves the volume and timer a sound already remembers', async () => {
    await recordSession('underwater', { volume: 0.3, timerMinutes: 15 });
    await storeLegacy(['underwater']);
    await migrateFavourites();

    const state = await getSoundState('underwater');
    expect(state).toMatchObject({ saved: true, lastVolume: 0.3, lastTimerMinutes: 15 });
    expect(state.sessionCount).toBe(1);
  });

  it('does nothing at all for a new install', async () => {
    await migrateFavourites();
    expect(await getSavedIds()).toEqual([]);
  });

  it('survives an old entry that is not readable', async () => {
    // A corrupt entry must not stop the app opening, whatever else it costs.
    await AsyncStorage.setItem('favourites', '{not json');
    await expect(migrateFavourites()).resolves.toBeUndefined();
  });

  it('survives an old entry that is not a list of ids', async () => {
    await AsyncStorage.setItem('favourites', JSON.stringify({ underwater: true }));
    await expect(migrateFavourites()).resolves.toBeUndefined();
    expect(await getSavedIds()).toEqual([]);
  });
});

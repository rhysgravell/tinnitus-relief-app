import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_SOUND_STATE,
  getSavedIds,
  getSoundState,
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

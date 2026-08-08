import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLastSession, setLastSession } from './sessions';

const session = {
  soundId: 'rain-on-canvas',
  endedAt: '2026-08-07T23:14:00.000Z',
  durationMinutes: 42,
  timerMinutes: 45,
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('last session', () => {
  it('is null for a first-run user', async () => {
    // The resume card is omitted entirely on null, so this is the first-run signal.
    expect(await getLastSession()).toBeNull();
  });

  it('round-trips a session', async () => {
    await setLastSession(session);
    expect(await getLastSession()).toEqual(session);
  });

  it('keeps only the most recent session', async () => {
    await setLastSession(session);
    await setLastSession({ ...session, soundId: 'underwater', durationMinutes: 12 });
    const stored = await getLastSession();
    expect(stored?.soundId).toBe('underwater');
    expect(stored?.durationMinutes).toBe(12);
  });

  it('stores a session that ran without a timer', async () => {
    await setLastSession({ ...session, timerMinutes: null });
    expect((await getLastSession())?.timerMinutes).toBeNull();
  });
});

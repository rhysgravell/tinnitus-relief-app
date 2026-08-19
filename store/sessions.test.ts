import AsyncStorage from '@react-native-async-storage/async-storage';
import { addSession, getLastSession, getSessions, sessionNights } from './sessions';
import type { Session } from './sessions';

const session: Session = {
  soundId: 'rain-on-canvas',
  endedAt: '2026-08-07T23:14:00.000Z',
  durationMinutes: 42,
  timerMinutes: 45,
};

/** A session that ended at a local time on a given day. */
function endedAt(year: number, month: number, day: number, hour: number, minute = 0): Session {
  return { ...session, endedAt: new Date(year, month, day, hour, minute).toISOString() };
}

beforeEach(async () => {
  // Restored as well as cleared: the failure tests below spy on the storage itself.
  jest.restoreAllMocks();
  await AsyncStorage.clear();
});

describe('the session log', () => {
  it('is empty for a first-run user', async () => {
    expect(await getSessions()).toEqual([]);
    // The resume card is omitted entirely on null, so this is the first-run signal.
    expect(await getLastSession()).toBeNull();
  });

  it('round-trips a session', async () => {
    await addSession(session);
    expect(await getLastSession()).toEqual(session);
  });

  it('keeps the ones before it too', async () => {
    // What the trend correlates against. Before this there was only ever the last one.
    await addSession(session);
    await addSession({ ...session, soundId: 'underwater', endedAt: '2026-08-08T22:00:00.000Z' });

    expect((await getSessions()).map((entry) => entry.soundId)).toEqual([
      'underwater',
      'rain-on-canvas',
    ]);
  });

  it('hands back the most recent first, whatever order they arrived in', async () => {
    // A session recorded late — the write is fired off as the screen unmounts — must not
    // become the one the resume card shows.
    await addSession({ ...session, endedAt: '2026-08-09T21:00:00.000Z' });
    await addSession({ ...session, soundId: 'underwater', endedAt: '2026-08-08T22:00:00.000Z' });

    expect((await getLastSession())?.endedAt).toBe('2026-08-09T21:00:00.000Z');
  });

  it('stores a session that ran without a timer', async () => {
    await addSession({ ...session, timerMinutes: null });
    expect((await getLastSession())?.timerMinutes).toBeNull();
  });

  it('drops sessions older than the log keeps', async () => {
    // Nothing reads further back than 30 days, and a log kept forever grows on a phone
    // with nothing ever asking it to stop.
    const old = { ...session, soundId: 'underwater', endedAt: '2026-01-01T22:00:00.000Z' };
    await AsyncStorage.setItem('sessions', JSON.stringify([old]));
    await addSession(session);

    expect((await getSessions()).map((entry) => entry.soundId)).toEqual(['rain-on-canvas']);
  });

  it('keeps everything inside the window', async () => {
    const recent = { ...session, soundId: 'underwater', endedAt: '2026-07-10T22:00:00.000Z' };
    await AsyncStorage.setItem('sessions', JSON.stringify([recent]));
    await addSession(session);

    expect(await getSessions()).toHaveLength(2);
  });
});

describe('the last session written by an older build', () => {
  it('becomes the first entry of the log', async () => {
    await AsyncStorage.setItem('lastSession', JSON.stringify(session));
    expect(await getSessions()).toEqual([session]);
  });

  it('is carried over once and then forgotten', async () => {
    // The absent key is what says the migration has already happened. Leaving it would
    // resurrect a session the user had since run past.
    await AsyncStorage.setItem('lastSession', JSON.stringify(session));
    await getSessions();

    expect(await AsyncStorage.getItem('lastSession')).toBeNull();
    expect(await getSessions()).toEqual([session]);
  });

  it('does not come back once there is a log', async () => {
    await AsyncStorage.setItem('lastSession', JSON.stringify(session));
    const newer = { ...session, soundId: 'underwater', endedAt: '2026-08-08T22:00:00.000Z' };
    await addSession(newer);

    expect(await getSessions()).toEqual([newer, session]);
  });
});

describe('the nights sessions ran on', () => {
  it('files a session under the day it ended on', () => {
    expect(sessionNights([endedAt(2026, 7, 14, 22, 30)])).toEqual(new Set(['2026-08-14']));
  });

  it('files one that ended after midnight under the night before', () => {
    // A session that finished at 1am was part of the 14th's night, and that is the day
    // the check-in it belongs with was logged against.
    expect(sessionNights([endedAt(2026, 7, 15, 1, 20)])).toEqual(new Set(['2026-08-14']));
  });

  it('treats a morning session as its own day', () => {
    expect(sessionNights([endedAt(2026, 7, 15, 9, 0)])).toEqual(new Set(['2026-08-15']));
  });

  it('counts a night once however many sessions ran on it', () => {
    const nights = sessionNights([endedAt(2026, 7, 14, 21, 0), endedAt(2026, 7, 15, 2, 0)]);
    expect(nights).toEqual(new Set(['2026-08-14']));
  });
});

describe('two sessions landing together', () => {
  it('logs both', async () => {
    await Promise.all([
      addSession({
        soundId: 'underwater',
        endedAt: '2026-08-17T23:10:00.000Z',
        durationMinutes: 30,
        timerMinutes: 30,
      }),
      addSession({
        soundId: 'at-the-beach',
        endedAt: '2026-08-18T23:40:00.000Z',
        durationMinutes: 45,
        timerMinutes: 45,
      }),
    ]);

    expect((await getSessions()).map(({ soundId }) => soundId)).toEqual([
      'at-the-beach',
      'underwater',
    ]);
  });
});

describe('when a write fails', () => {
  it('still reads the log when the old key cannot be carried over', async () => {
    // The carry-over writes, and the resume card and the whole Check-in screen wait on this
    // read. Failing it would blank both of them over one old session.
    await AsyncStorage.setItem('lastSession', JSON.stringify(session));
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));

    await expect(getSessions()).resolves.toEqual([]);
  });

  it('carries the old key over on the next go instead', async () => {
    await AsyncStorage.setItem('lastSession', JSON.stringify(session));
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
    await getSessions();

    expect(await getSessions()).toEqual([session]);
  });
});

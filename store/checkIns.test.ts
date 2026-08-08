import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCheckIn,
  getCheckIns,
  getRecentCheckIns,
  MOOD_OPTIONS,
  saveCheckIn,
  today,
} from './checkIns';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('today', () => {
  it('formats the local date as YYYY-MM-DD', () => {
    expect(today(new Date(2026, 7, 8, 12, 0))).toBe('2026-08-08');
  });

  it('pads single-digit months and days', () => {
    expect(today(new Date(2026, 0, 3, 12, 0))).toBe('2026-01-03');
  });

  it('uses the local date late at night, not the UTC one', () => {
    // 23:30 local on the 8th is already the 9th in UTC for anyone west of the line.
    // Getting this wrong would file a bedtime check-in under tomorrow.
    expect(today(new Date(2026, 7, 8, 23, 30))).toBe('2026-08-08');
  });
});

describe('check-ins', () => {
  it('starts empty', async () => {
    expect(await getCheckIns()).toEqual([]);
  });

  it('stores an entry', async () => {
    await saveCheckIn({ date: '2026-08-08', loudness: 3, mood: 'calm' });
    expect(await getCheckIns()).toEqual([{ date: '2026-08-08', loudness: 3, mood: 'calm' }]);
  });

  it('replaces the entry for a date rather than duplicating it', async () => {
    await saveCheckIn({ date: '2026-08-08', loudness: 3, mood: 'calm' });
    const entries = await saveCheckIn({ date: '2026-08-08', loudness: 5, mood: 'anxious' });
    expect(entries).toHaveLength(1);
    expect(entries[0].loudness).toBe(5);
  });

  it('returns entries oldest first whatever order they were written in', async () => {
    await saveCheckIn({ date: '2026-08-08', loudness: 2, mood: 'good' });
    await saveCheckIn({ date: '2026-08-06', loudness: 4, mood: 'tired' });
    await saveCheckIn({ date: '2026-08-07', loudness: 3, mood: 'low' });
    expect((await getCheckIns()).map((c) => c.date)).toEqual([
      '2026-08-06',
      '2026-08-07',
      '2026-08-08',
    ]);
  });

  it('finds an entry by date', async () => {
    await saveCheckIn({ date: '2026-08-08', loudness: 3, mood: 'calm' });
    expect((await getCheckIn('2026-08-08'))?.mood).toBe('calm');
    expect(await getCheckIn('2026-08-07')).toBeUndefined();
  });

  it('takes the most recent entries for the trend, oldest first', async () => {
    for (const day of ['04', '05', '06', '07', '08']) {
      await saveCheckIn({ date: `2026-08-${day}`, loudness: 3, mood: 'calm' });
    }
    expect((await getRecentCheckIns(3)).map((c) => c.date)).toEqual([
      '2026-08-06',
      '2026-08-07',
      '2026-08-08',
    ]);
  });

  it('returns everything when fewer entries exist than the trend window', async () => {
    await saveCheckIn({ date: '2026-08-08', loudness: 3, mood: 'calm' });
    expect(await getRecentCheckIns(14)).toHaveLength(1);
  });
});

describe('mood options', () => {
  it('offers the six chips from the design', () => {
    expect(MOOD_OPTIONS.map((m) => m.label)).toEqual([
      'Calm',
      'Tired',
      'Anxious',
      'Frustrated',
      'Low',
      'Good',
    ]);
  });

  it('carries no emoji', () => {
    // The redesign dropped emoji deliberately: they rendered inconsistently across OS
    // versions and made the app read as unfinished.
    for (const { label } of MOOD_OPTIONS) {
      expect(label).toMatch(/^[A-Za-z ]+$/);
    }
  });
});

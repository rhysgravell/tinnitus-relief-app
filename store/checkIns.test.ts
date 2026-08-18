import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  draftStatus,
  EMPTY_DRAFT,
  getCheckIns,
  LOUDNESS_LEVELS,
  MOOD_OPTIONS,
  saveCheckIn,
  saveLabel,
  today,
} from './checkIns';
import type { CheckIn } from './checkIns';

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

describe('the loudness scale', () => {
  it('runs from one to five', () => {
    expect(LOUDNESS_LEVELS).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('draft status', () => {
  const stored: CheckIn = { date: '2026-08-08', loudness: 3, mood: 'calm' };

  it('is incomplete until both questions are answered', () => {
    expect(draftStatus(EMPTY_DRAFT, undefined)).toBe('incomplete');
    expect(draftStatus({ loudness: 3, mood: null }, undefined)).toBe('incomplete');
    expect(draftStatus({ loudness: null, mood: 'calm' }, undefined)).toBe('incomplete');
  });

  it('is new when the day has not been logged yet', () => {
    expect(draftStatus({ loudness: 3, mood: 'calm' }, undefined)).toBe('new');
  });

  it('is saved when it matches what is stored', () => {
    expect(draftStatus({ loudness: 3, mood: 'calm' }, stored)).toBe('saved');
  });

  it('is changed when either answer differs from what is stored', () => {
    expect(draftStatus({ loudness: 4, mood: 'calm' }, stored)).toBe('changed');
    expect(draftStatus({ loudness: 3, mood: 'tired' }, stored)).toBe('changed');
  });

  it('labels the button by what pressing it would do', () => {
    expect(saveLabel('incomplete')).toBe('Save today');
    expect(saveLabel('new')).toBe('Save today');
    expect(saveLabel('changed')).toBe('Update today');
    expect(saveLabel('saved')).toBe('Saved');
  });
});

describe('two check-ins landing together', () => {
  it('keeps both days', async () => {
    await Promise.all([
      saveCheckIn({ date: '2026-08-17', loudness: 2, mood: 'calm' }),
      saveCheckIn({ date: '2026-08-18', loudness: 4, mood: 'tired' }),
    ]);

    expect((await getCheckIns()).map(({ date }) => date)).toEqual(['2026-08-17', '2026-08-18']);
  });
});

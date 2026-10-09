import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  checkInDay,
  checkInQuestion,
  draftStatus,
  EMPTY_DRAFT,
  getCheckIns,
  localDate,
  LOUDNESS_ENDS,
  LOUDNESS_LEVELS,
  loudnessLabel,
  MOOD_OPTIONS,
  saveCheckIn,
  nightDate,
  saveLabel,
} from './checkIns';
import type { CheckIn } from './checkIns';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('nightDate', () => {
  it('formats the local date as YYYY-MM-DD', () => {
    expect(nightDate(new Date(2026, 7, 8, 12, 0))).toBe('2026-08-08');
  });

  it('pads single-digit months and days', () => {
    expect(nightDate(new Date(2026, 0, 3, 12, 0))).toBe('2026-01-03');
  });

  it('uses the local date late at night, not the UTC one', () => {
    // 23:30 local on the 8th is already the 9th in UTC for anyone west of the line.
    // Getting this wrong would file a bedtime check-in under tomorrow.
    expect(nightDate(new Date(2026, 7, 8, 23, 30))).toBe('2026-08-08');
  });

  it('files the small hours under the night before', () => {
    // 1am on the 9th is the night of the 8th — the same night `sessions.ts` files a
    // session that ran past midnight under.
    expect(nightDate(new Date(2026, 7, 9, 1, 0))).toBe('2026-08-08');
  });

  it('turns over at 5am', () => {
    expect(nightDate(new Date(2026, 7, 9, 4, 59))).toBe('2026-08-08');
    expect(nightDate(new Date(2026, 7, 9, 5, 0))).toBe('2026-08-09');
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

  it('gives every level its position in the scale', () => {
    // Without this a bar is a button with a number and no range to put it in.
    for (const level of LOUDNESS_LEVELS) {
      expect(loudnessLabel(level)).toContain(`Level ${level} of 5`);
    }
  });

  it('names the quiet end with the words drawn under it', () => {
    expect(loudnessLabel(1)).toBe(`Level 1 of 5, ${LOUDNESS_ENDS.low}`);
  });

  it('names the loud end with the words drawn under it', () => {
    expect(loudnessLabel(5)).toBe(`Level 5 of 5, ${LOUDNESS_ENDS.high}`);
  });

  it('leaves the middle of the scale unnamed, as the screen does', () => {
    // Naming all five would ask the user to accept a word for their own tinnitus. The ends
    // are there to set the range, not to label the answer.
    for (const level of [2, 3, 4] as const) {
      expect(loudnessLabel(level)).toBe(`Level ${level} of 5`);
    }
  });

  it('names the first and last levels whatever the scale is, and no others', () => {
    // Derived rather than listed, so a scale that grew a level keeps naming its two ends.
    const named = LOUDNESS_LEVELS.filter((level) => loudnessLabel(level).includes(','));
    expect(named).toEqual([LOUDNESS_LEVELS[0], LOUDNESS_LEVELS[LOUDNESS_LEVELS.length - 1]]);
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
    expect(saveLabel('incomplete', 'today')).toBe('Save today');
    expect(saveLabel('new', 'today')).toBe('Save today');
    expect(saveLabel('changed', 'today')).toBe('Update today');
    expect(saveLabel('saved', 'today')).toBe('Saved');
  });

  it('names the night it would write to, when that is not today', () => {
    expect(saveLabel('new', 'last night')).toBe('Save last night');
    expect(saveLabel('changed', 'last night')).toBe('Update last night');
  });

  it('still just says "Saved", which is about the tap and not about the day', () => {
    expect(saveLabel('saved', 'last night')).toBe('Saved');
  });
});

describe('the day the check-in screen says it is asking about', () => {
  it('is today through the evening, when the app is normally opened', () => {
    expect(checkInDay(new Date(2026, 7, 8, 21, 30))).toBe('today');
    expect(checkInDay(new Date(2026, 7, 8, 23, 59))).toBe('today');
  });

  it('is last night after midnight, which is the night the entry files under', () => {
    // The bug: the heading said "How was today?" and the button "Save today" while
    // `nightDate` filed the answer under the day before.
    expect(checkInDay(new Date(2026, 7, 9, 0, 1))).toBe('last night');
    expect(checkInDay(new Date(2026, 7, 9, 4, 59))).toBe('last night');
  });

  it('is today again once the night has turned over', () => {
    expect(checkInDay(new Date(2026, 7, 9, 5, 0))).toBe('today');
  });

  it('agrees with the date the answer is filed under, at every hour of the day', () => {
    // The rule rather than the hours: the wording is only ever wrong when it disagrees
    // with `nightDate`, so compare the two directly and let the turnover move if it ever
    // needs to.
    for (let hour = 0; hour < 24; hour += 1) {
      const now = new Date(2026, 7, 9, hour, 30);
      const sameDay = nightDate(now) === localDate(now);
      expect(checkInDay(now)).toBe(sameDay ? 'today' : 'last night');
    }
  });

  it('asks about that day in its heading', () => {
    expect(checkInQuestion('today')).toBe('How was today?');
    expect(checkInQuestion('last night')).toBe('How was last night?');
  });

  it('asks about the same day the button offers to save', () => {
    // One noun behind both, so the screen cannot ask about one day and save another.
    for (const day of ['today', 'last night'] as const) {
      expect(checkInQuestion(day)).toContain(day);
      expect(saveLabel('new', day)).toContain(day);
    }
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

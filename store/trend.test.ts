import {
  chartLabel,
  hasEarlierThan,
  loggedDays,
  TREND_DAYS,
  trendCaption,
  trendWindow,
} from './trend';
import type { CheckIn, Loudness, Mood } from './checkIns';

/** Midday, so nothing in these tests depends on a timezone. */
const NOW = new Date(2026, 7, 14, 12, 0);

function entry(date: string, loudness: Loudness, mood: Mood = 'calm'): CheckIn {
  return { date, loudness, mood };
}

/** `levels[0]` is the oldest, landing `levels.length - 1` days before NOW. */
function run(levels: Loudness[], end: Date = NOW): CheckIn[] {
  return levels.map((loudness, index) => {
    const date = new Date(end);
    date.setDate(date.getDate() - (levels.length - 1 - index));
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return entry(`${date.getFullYear()}-${month}-${day}`, loudness);
  });
}

describe('trendWindow', () => {
  it('runs to today and back the number of days asked for', () => {
    const window = trendWindow([], TREND_DAYS, NOW);
    expect(window).toHaveLength(TREND_DAYS);
    expect(window[0].date).toBe('2026-08-01');
    expect(window[TREND_DAYS - 1].date).toBe('2026-08-14');
  });

  it('puts each entry on its own day', () => {
    const window = trendWindow([entry('2026-08-12', 4)], TREND_DAYS, NOW);
    expect(window.find((day) => day.date === '2026-08-12')?.entry?.loudness).toBe(4);
  });

  it('leaves a missed day empty rather than closing the gap', () => {
    // A fortnight of silence has to read as silence; a chart that packed the entries
    // together would show a trend that never happened.
    const window = trendWindow([entry('2026-08-10', 2), entry('2026-08-14', 2)], 5, NOW);
    expect(window.map((day) => day.entry !== undefined)).toEqual([true, false, false, false, true]);
  });

  it('ignores entries older than the window', () => {
    const window = trendWindow([entry('2026-07-01', 5)], TREND_DAYS, NOW);
    expect(loggedDays(window)).toEqual([]);
  });

  it('crosses a month boundary', () => {
    const window = trendWindow([], 3, new Date(2026, 8, 1, 12, 0));
    expect(window.map((day) => day.date)).toEqual(['2026-08-30', '2026-08-31', '2026-09-01']);
  });

  it('stays on the right dates through a clock change', () => {
    // Britain's clocks go back on 25 October 2026, making that day 25 hours long. Stepping
    // back in whole days from midnight would land twice on the same date.
    const window = trendWindow([], 4, new Date(2026, 9, 26, 12, 0));
    expect(window.map((day) => day.date)).toEqual([
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
    ]);
  });
});

describe('hasEarlierThan', () => {
  it('is true when history runs off the start of the window', () => {
    const entries = [entry('2026-07-01', 3), entry('2026-08-12', 3)];
    expect(hasEarlierThan(entries, trendWindow(entries, TREND_DAYS, NOW))).toBe(true);
  });

  it('is false when the window already shows everything', () => {
    const entries = [entry('2026-08-12', 3)];
    expect(hasEarlierThan(entries, trendWindow(entries, TREND_DAYS, NOW))).toBe(false);
  });
});

describe('trendCaption', () => {
  it('says what it is waiting for when nothing has been logged', () => {
    expect(trendCaption(trendWindow([], TREND_DAYS, NOW))).toBe(
      'Check in for a few days and your own pattern shows up here.'
    );
  });

  it('counts down to the point where it can say something', () => {
    expect(trendCaption(trendWindow(run([3]), TREND_DAYS, NOW))).toBe(
      '2 more check-ins and this starts to show a direction.'
    );
    expect(trendCaption(trendWindow(run([3, 3]), TREND_DAYS, NOW))).toBe(
      'One more check-in and this starts to show a direction.'
    );
  });

  it('calls it quieter when the recent half is lower', () => {
    const entries = run([5, 5, 4, 4, 2, 2]);
    expect(trendCaption(trendWindow(entries, TREND_DAYS, NOW))).toBe(
      'Quieter lately — averaging 2.7, against 4.7 before that.'
    );
  });

  it('calls it louder when the recent half is higher', () => {
    const entries = run([1, 1, 2, 4, 4, 5]);
    expect(trendCaption(trendWindow(entries, TREND_DAYS, NOW))).toBe(
      'Louder lately — averaging 4.3, against 1.3 before that.'
    );
  });

  it('holds off on a direction for a change smaller than half a point', () => {
    // Four days at 3 and two at 4 is noise, not an improvement, and calling it one would
    // teach the user to distrust the sentence.
    const entries = run([3, 3, 4, 3, 3, 4]);
    expect(trendCaption(trendWindow(entries, TREND_DAYS, NOW))).toBe(
      'Holding steady, averaging 3.3 across 6 check-ins.'
    );
  });

  it('drops a trailing zero rather than printing 3.0', () => {
    expect(trendCaption(trendWindow(run([3, 3, 3]), TREND_DAYS, NOW))).toBe(
      'Holding steady, averaging 3 across 3 check-ins.'
    );
  });

  it('reads the gaps as gaps rather than as quiet days', () => {
    // Only the days that were logged are averaged. A missed day is not a zero.
    const entries = [entry('2026-08-02', 5), entry('2026-08-13', 2), entry('2026-08-14', 2)];
    expect(trendCaption(trendWindow(entries, TREND_DAYS, NOW))).toBe(
      'Quieter lately — averaging 2, against 3.5 before that.'
    );
  });
});

describe('chartLabel', () => {
  it('says there is nothing yet', () => {
    expect(chartLabel(trendWindow([], TREND_DAYS, NOW))).toBe('No check-ins in the last 14 days.');
  });

  it('summarises the range for a screen reader instead of listing every bar', () => {
    const entries = run([2, 4, 3]);
    expect(chartLabel(trendWindow(entries, TREND_DAYS, NOW))).toBe(
      'Loudness, 3 check-ins over 14 days: from 2 to 4, most recently 3.'
    );
  });

  it('counts one check-in in the singular', () => {
    expect(chartLabel(trendWindow(run([4]), TREND_DAYS, NOW))).toBe(
      'Loudness, 1 check-in over 14 days: from 4 to 4, most recently 4.'
    );
  });
});

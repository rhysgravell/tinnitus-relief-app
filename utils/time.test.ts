import { formatTimeOfDay, greetingFor, parseTimeOfDay, relativeDayLabel } from './time';

/** Local time, since both functions read the local calendar day. */
function at(iso: string): Date {
  return new Date(iso);
}

describe('greetingFor', () => {
  it.each([
    ['2026-08-09T06:30:00', 'Good morning'],
    ['2026-08-09T11:59:00', 'Good morning'],
    ['2026-08-09T12:00:00', 'Good afternoon'],
    ['2026-08-09T17:59:00', 'Good afternoon'],
    ['2026-08-09T18:00:00', 'Good evening'],
    ['2026-08-09T23:30:00', 'Good evening'],
  ])('greets %s with "%s"', (iso, expected) => {
    expect(greetingFor(at(iso))).toBe(expected);
  });

  it('greets the small hours as morning rather than inventing a fourth greeting', () => {
    // 3am is nobody's evening, and the design only specifies three greetings.
    expect(greetingFor(at('2026-08-09T03:00:00'))).toBe('Good morning');
  });

  it('never addresses the user by name', () => {
    // The design reads "Good evening, Rhys", but nothing in the app collects a name — the
    // onboarding screen that would is deferred — so the greeting stands alone.
    expect(greetingFor(at('2026-08-09T20:00:00'))).not.toContain(',');
  });
});

describe('relativeDayLabel', () => {
  const now = at('2026-08-09T20:00:00');

  it('calls a session earlier the same day earlier today', () => {
    expect(relativeDayLabel(at('2026-08-09T09:00:00'), now)).toBe('Earlier today');
  });

  it('calls a session that ran past midnight last night', () => {
    // Technically today, but nobody describes 1am as this morning.
    expect(relativeDayLabel(at('2026-08-09T01:00:00'), now)).toBe('Last night');
  });

  it('calls yesterday evening last night', () => {
    expect(relativeDayLabel(at('2026-08-08T22:30:00'), now)).toBe('Last night');
  });

  it('calls yesterday afternoon yesterday', () => {
    expect(relativeDayLabel(at('2026-08-08T14:00:00'), now)).toBe('Yesterday');
  });

  it('counts the days for anything in the last week', () => {
    expect(relativeDayLabel(at('2026-08-06T22:00:00'), now)).toBe('3 days ago');
  });

  it('stops counting past a week', () => {
    expect(relativeDayLabel(at('2026-07-20T22:00:00'), now)).toBe('Over a week ago');
  });

  it('counts calendar days rather than elapsed hours', () => {
    // Nine hours apart, but two different days: "Last night" beats "Earlier today".
    expect(relativeDayLabel(at('2026-08-08T23:00:00'), at('2026-08-09T08:00:00'))).toBe(
      'Last night'
    );
  });
});

describe('parseTimeOfDay', () => {
  it('reads a stored reminder time', () => {
    expect(parseTimeOfDay('22:30')).toEqual({ hour: 22, minute: 30 });
  });

  it('reads midnight and the last minute of the day', () => {
    expect(parseTimeOfDay('00:00')).toEqual({ hour: 0, minute: 0 });
    expect(parseTimeOfDay('23:59')).toEqual({ hour: 23, minute: 59 });
  });

  it('accepts a single-digit hour', () => {
    expect(parseTimeOfDay('9:05')).toEqual({ hour: 9, minute: 5 });
  });

  it.each(['', '2230', '22.30', 'half ten', '22:3', '22:300'])(
    'refuses %p rather than guessing at it',
    (value) => {
      expect(parseTimeOfDay(value)).toBeNull();
    }
  );

  it.each(['24:00', '25:30', '22:60'])('refuses %p, which is not a time', (value) => {
    // A value written by another build must not end up scheduling a reminder for hour 47.
    expect(parseTimeOfDay(value)).toBeNull();
  });
});

describe('formatTimeOfDay', () => {
  it('writes the 24 hour clock the design uses', () => {
    expect(formatTimeOfDay({ hour: 22, minute: 30 })).toBe('22:30');
  });

  it('pads both halves so the column does not jump', () => {
    expect(formatTimeOfDay({ hour: 9, minute: 5 })).toBe('09:05');
  });

  it('round-trips what it parsed', () => {
    expect(formatTimeOfDay(parseTimeOfDay('07:45')!)).toBe('07:45');
  });
});

import { formatClock, spokenClock, wholeMinutes } from './duration';

describe('formatClock', () => {
  it('pads the seconds but not the minutes', () => {
    expect(formatClock(7)).toBe('0:07');
    expect(formatClock(1934)).toBe('32:14');
  });

  it('starts at zero', () => {
    expect(formatClock(0)).toBe('0:00');
  });

  it('rolls over into an hours field only once there is an hour to show', () => {
    // The ∞ timer has no upper bound, so an all-night session has to read sensibly.
    expect(formatClock(3599)).toBe('59:59');
    expect(formatClock(3600)).toBe('1:00:00');
    expect(formatClock(3860)).toBe('1:04:20');
  });

  it('drops the fractional part rather than rounding up to a second that has not passed', () => {
    expect(formatClock(59.9)).toBe('0:59');
  });

  it('treats a negative span as zero', () => {
    // Clock drift or a paused session resumed after a clock change could produce one.
    expect(formatClock(-30)).toBe('0:00');
  });
});

describe('spokenClock', () => {
  it('says a span in units rather than as a clock face', () => {
    // "32:14" is read out as the characters it is made of, or as a time of day.
    expect(spokenClock(1934)).toBe('32 minutes, 14 seconds');
  });

  it('says the hours field when there is one', () => {
    expect(spokenClock(3860)).toBe('1 hour, 4 minutes, 20 seconds');
  });

  it('leaves out a field that is zero', () => {
    // "1 hour, 0 minutes, 0 seconds" is a reading of the digits, not of the span.
    expect(spokenClock(3600)).toBe('1 hour');
    expect(spokenClock(1800)).toBe('30 minutes');
    expect(spokenClock(7)).toBe('7 seconds');
  });

  it('counts one of anything in the singular', () => {
    expect(spokenClock(1)).toBe('1 second');
    expect(spokenClock(60)).toBe('1 minute');
    expect(spokenClock(3661)).toBe('1 hour, 1 minute, 1 second');
  });

  it('still reads out nothing at all, which is where the clock starts and a timer ends', () => {
    expect(spokenClock(0)).toBe('0 seconds');
  });

  it('agrees with the clock face about which second it is on', () => {
    // Both floor and both floor at zero, so the two readings of one clock cannot disagree.
    expect(spokenClock(59.9)).toBe('59 seconds');
    expect(spokenClock(-30)).toBe('0 seconds');
  });
});

describe('wholeMinutes', () => {
  it('rounds to the nearest minute', () => {
    expect(wholeMinutes(2680)).toBe(45);
    expect(wholeMinutes(2670)).toBe(45);
    expect(wholeMinutes(1770)).toBe(30);
  });

  it('never records a session as zero minutes', () => {
    // A session someone stopped after ten seconds still happened, and the resume card
    // has to say something about it.
    expect(wholeMinutes(10)).toBe(1);
    expect(wholeMinutes(0)).toBe(1);
  });
});

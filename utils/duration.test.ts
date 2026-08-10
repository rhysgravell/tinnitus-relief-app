import { formatClock, wholeMinutes } from './duration';

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

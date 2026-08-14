import { DARK_FROM_HOUR, DARK_UNTIL_HOUR, isDarkHour, msUntilNextDarkChange } from './darkHours';

/** A local time on an ordinary Friday. */
function at(hour: number, minute = 0) {
  return new Date(2026, 7, 14, hour, minute);
}

const HOUR_MS = 60 * 60 * 1000;

describe('isDarkHour', () => {
  it('is light through the day', () => {
    expect(isDarkHour(at(9))).toBe(false);
    expect(isDarkHour(at(12))).toBe(false);
    expect(isDarkHour(at(18, 59))).toBe(false);
  });

  it('turns dark on the hour, not a minute before', () => {
    expect(isDarkHour(at(DARK_FROM_HOUR - 1, 59))).toBe(false);
    expect(isDarkHour(at(DARK_FROM_HOUR))).toBe(true);
  });

  it('stays dark across midnight', () => {
    expect(isDarkHour(at(23, 59))).toBe(true);
    expect(isDarkHour(at(0))).toBe(true);
    expect(isDarkHour(at(3, 30))).toBe(true);
  });

  it('is still dark at 5am', () => {
    // Awake at five with your ears ringing is the case this whole setting is for.
    expect(isDarkHour(at(DARK_UNTIL_HOUR - 1, 59))).toBe(true);
    expect(isDarkHour(at(DARK_UNTIL_HOUR))).toBe(false);
  });
});

describe('msUntilNextDarkChange', () => {
  it('counts the daytime down to the evening', () => {
    expect(msUntilNextDarkChange(at(18))).toBe(HOUR_MS);
    expect(msUntilNextDarkChange(at(12))).toBe(7 * HOUR_MS);
  });

  it('counts the evening down to the morning after', () => {
    // 19:00 to 06:00 is eleven hours, and the answer has to cross midnight to find it.
    expect(msUntilNextDarkChange(at(19))).toBe(11 * HOUR_MS);
    expect(msUntilNextDarkChange(at(23))).toBe(7 * HOUR_MS);
  });

  it('counts the small hours down to the same morning', () => {
    expect(msUntilNextDarkChange(at(2))).toBe(4 * HOUR_MS);
  });

  it('lands on the boundary itself', () => {
    const evening = at(18, 30);
    expect(new Date(evening.getTime() + msUntilNextDarkChange(evening)).getHours()).toBe(
      DARK_FROM_HOUR
    );

    const night = at(22, 15);
    expect(new Date(night.getTime() + msUntilNextDarkChange(night)).getHours()).toBe(
      DARK_UNTIL_HOUR
    );
  });

  it('never answers with no time at all', () => {
    // A timer scheduled for zero would fire, find the hour unchanged, and do it again.
    expect(msUntilNextDarkChange(at(DARK_FROM_HOUR, 0))).toBeGreaterThan(0);
    expect(msUntilNextDarkChange(new Date(2026, 7, 14, 18, 59, 59, 999))).toBeGreaterThan(0);
  });
});

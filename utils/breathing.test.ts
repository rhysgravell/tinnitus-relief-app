import { BREATHING_PHASES, CYCLE_SECONDS, breathAt } from './breathing';

/** The phase label and its countdown, which is all the screen shows. */
function at(elapsedSeconds: number): string {
  const { phase, secondsRemaining } = breathAt(elapsedSeconds);
  return `${phase.label} ${secondsRemaining}`;
}

describe('the breath pattern', () => {
  it('gives the out-breath more time than the in-breath', () => {
    // The long exhale is the half that settles the nervous system.
    const inBreath = BREATHING_PHASES.find((phase) => phase.direction === 'in');
    const outBreath = BREATHING_PHASES.find((phase) => phase.direction === 'out');
    expect(outBreath?.seconds).toBeGreaterThan(inBreath?.seconds ?? 0);
  });

  it('runs sixteen seconds to the cycle', () => {
    expect(CYCLE_SECONDS).toBe(16);
  });

  it('moves the circle in exactly one direction at a time', () => {
    const directions = BREATHING_PHASES.map((phase) => phase.direction);
    expect(directions).toEqual(['in', 'hold', 'out', 'hold']);
  });
});

describe('breathAt', () => {
  it('opens on the in-breath with the whole phase to go', () => {
    expect(at(0)).toBe('Breathe in 4');
  });

  it('counts a phase down to one rather than to zero', () => {
    // A zero on screen would read as a phase that has already finished.
    expect(at(1)).toBe('Breathe in 3');
    expect(at(3)).toBe('Breathe in 1');
  });

  it('moves on to the hold as the in-breath ends', () => {
    expect(at(4)).toBe('Hold 4');
  });

  it('reaches the out-breath after the first hold', () => {
    expect(at(8)).toBe('Breathe out 6');
  });

  it('ends the cycle on the short hold', () => {
    expect(at(14)).toBe('Hold 2');
    expect(at(15)).toBe('Hold 1');
  });

  it('starts the next breath where the first one began', () => {
    expect(at(CYCLE_SECONDS)).toBe('Breathe in 4');
    expect(at(CYCLE_SECONDS * 15 + 8)).toBe('Breathe out 6');
  });

  it('reads a fraction of a second as the second it is inside', () => {
    // The clock hands over whole seconds, but nothing here should depend on that.
    expect(at(4.9)).toBe('Hold 4');
  });

  it('treats a negative elapsed time as the start rather than wrapping', () => {
    expect(at(-3)).toBe('Breathe in 4');
  });
});

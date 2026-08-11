/**
 * The breath pattern the guided exercise follows, and where in it a given moment falls.
 *
 * A pure function over elapsed seconds rather than a hook with its own timer: the exercise
 * already has a clock counting its four minutes, and a second timer beside it would drift
 * away from the first.
 */

/** Which way the circle moves. A hold leaves it wherever the phase before put it. */
export type BreathDirection = 'in' | 'hold' | 'out';

export type BreathingPhase = {
  label: string;
  seconds: number;
  direction: BreathDirection;
};

/**
 * Four in, four held, six out, two held. The long out-breath is the point: it is the half
 * of the cycle that settles the nervous system, so it is the half given the most time.
 */
export const BREATHING_PHASES: readonly BreathingPhase[] = [
  { label: 'Breathe in', seconds: 4, direction: 'in' },
  { label: 'Hold', seconds: 4, direction: 'hold' },
  { label: 'Breathe out', seconds: 6, direction: 'out' },
  { label: 'Hold', seconds: 2, direction: 'hold' },
] as const;

export const CYCLE_SECONDS = BREATHING_PHASES.reduce((total, { seconds }) => total + seconds, 0);

export type Breath = {
  phase: BreathingPhase;
  /** Counts down within the phase, ending on 1 — so a 4 second phase reads 4, 3, 2, 1. */
  secondsRemaining: number;
};

/** Where in the cycle a given number of elapsed seconds falls. */
export function breathAt(elapsedSeconds: number): Breath {
  // Negative elapsed time is not a thing a clock produces, but a floor of zero costs
  // nothing and keeps the modulo below from wrapping to the end of the cycle.
  const withinCycle = Math.max(0, Math.floor(elapsedSeconds)) % CYCLE_SECONDS;

  let consumed = 0;
  for (const phase of BREATHING_PHASES) {
    consumed += phase.seconds;
    if (withinCycle < consumed) {
      return { phase, secondsRemaining: consumed - withinCycle };
    }
  }

  // Unreachable: `withinCycle` is less than the sum of the phases by construction. Kept so
  // the function has a total return type rather than an assertion.
  return { phase: BREATHING_PHASES[0], secondsRemaining: BREATHING_PHASES[0].seconds };
}

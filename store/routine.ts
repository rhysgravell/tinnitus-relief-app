/**
 * The wind-down routine, in the order it is meant to happen.
 *
 * The old version of this screen was a list of five unordered tips with an emoji each. The
 * redesign makes it a sequence — which is why the steps are numbered and why the order in
 * this array is the order on screen — and pulls the one step the app can do itself forward
 * into third place, where it lands after the two preparatory ones.
 */
export type RoutineStep = {
  id: string;
  title: string;
  /**
   * The title as it should be spoken, for a step whose own abbreviates. Absent on the three
   * that are already whole words, where the visible title reads as written.
   */
  spokenTitle?: string;
  detail: string;
  /** The step the app performs rather than describes. Only the breathing one has it. */
  action?: 'breathing';
};

/** How long the guided breathing runs for, in minutes. Named in step three's title. */
export const BREATHING_MINUTES = 4;

/**
 * Step three's title, in whichever reading is asked for. Composed rather than written out
 * twice so the two can only ever differ in the length and the separator — and so the
 * minutes cannot drift apart from `BREATHING_MINUTES`.
 */
function breathingTitle(length: string, separator: string): string {
  return `Slow breathing${separator}${length}`;
}

export const ROUTINE: readonly RoutineStep[] = [
  {
    id: 'dim-the-lights',
    title: 'Dim the lights',
    detail: 'An hour before bed, so your body starts the handover into sleep.',
  },
  {
    id: 'put-the-screens-down',
    title: 'Put the screens down',
    detail: 'Bright light late on makes the ringing harder to ignore.',
  },
  {
    id: 'slow-breathing',
    title: breathingTitle(`${BREATHING_MINUTES} min`, ' · '),
    // A screen reader says "4 min" as four metres and reads the middle dot as nothing at
    // all, so the spoken title says whole words and pauses on a comma.
    spokenTitle: breathingTitle(`${BREATHING_MINUTES} minutes`, ', '),
    detail: 'Guided, with your sound still playing underneath.',
    action: 'breathing',
  },
  {
    id: 'cool-dark-quiet-room',
    title: 'Cool, dark, quiet room',
    detail: 'Around 18°C is the usual sweet spot.',
  },
] as const;

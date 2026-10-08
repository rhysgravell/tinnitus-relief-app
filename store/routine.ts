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
  /**
   * The reason under the instruction. True on any night — the reading that needs no
   * evidence, so a caller that knows nothing about playback cannot state more than it
   * should.
   */
  detail: string;
  /**
   * The detail for a night where a sound is already playing, for the one step that can say
   * more when there is. Taken only on that evidence; absent, `detail` stands.
   */
  soundDetail?: string;
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

/**
 * Which reading of a step's detail tonight has earned.
 *
 * The app never claims what it is not doing, and step three's promise that a sound carries
 * on underneath is a claim about the player, not about the routine. The sheet the step
 * opens has been conditional since the promise was first checked there; this is the same
 * sentence one screen earlier, where it was still stated unconditionally.
 */
export function stepDetail(step: RoutineStep, soundPlaying: boolean): string {
  return soundPlaying ? (step.soundDetail ?? step.detail) : step.detail;
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
    detail: 'Guided, with a circle to set the pace.',
    // The routine can be read — and the breathing started — on a night where no sound was
    // ever opened, so the promise of one underneath waits until there is one to keep.
    soundDetail: 'Guided, with your sound still playing underneath.',
    action: 'breathing',
  },
  {
    id: 'cool-dark-quiet-room',
    title: 'Cool, dark, quiet room',
    detail: 'Around 18°C is the usual sweet spot.',
  },
] as const;

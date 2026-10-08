import { BREATHING_MINUTES, ROUTINE, stepDetail } from './routine';

describe('the wind-down routine', () => {
  it('reads as a sequence, not a pile of tips', () => {
    // The order in the array is the order on screen and the order of the numerals.
    expect(ROUTINE.map((step) => step.id)).toEqual([
      'dim-the-lights',
      'put-the-screens-down',
      'slow-breathing',
      'cool-dark-quiet-room',
    ]);
  });

  it('gives every step a reason as well as an instruction', () => {
    // A step with nothing under it is an order; the "why" is what makes it advice.
    for (const step of ROUTINE) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.detail.length).toBeGreaterThan(0);
    }
  });

  it('has exactly one step the app performs itself', () => {
    const actionable = ROUTINE.filter((step) => step.action);
    expect(actionable).toHaveLength(1);
    expect(actionable[0].action).toBe('breathing');
  });

  it('names the length of the breathing in its own title', () => {
    // So the step and the exercise cannot claim different durations.
    const breathing = ROUTINE.find((step) => step.action === 'breathing');
    expect(breathing?.title).toContain(`${BREATHING_MINUTES} min`);
  });

  it('says that length in full for a screen reader, which reads "min" as metres', () => {
    const breathing = ROUTINE.find((step) => step.action === 'breathing');
    expect(breathing?.spokenTitle).toBe(`Slow breathing, ${BREATHING_MINUTES} minutes`);
  });

  it('gives a spoken title to every step whose own abbreviates, and no others', () => {
    // The rule rather than the string: a step added later with "· 10 min" in its title
    // fails here until it is given something to say.
    for (const step of ROUTINE) {
      const abbreviates = step.title.includes('·') || /\d+\s*min\b/.test(step.title);
      if (!abbreviates) {
        expect(step.spokenTitle).toBeUndefined();
        continue;
      }
      expect(step.spokenTitle).toBeDefined();
      expect(step.spokenTitle).not.toContain('·');
      expect(step.spokenTitle).not.toMatch(/\d+\s*min\b/);
    }
  });

  it('promises a sound underneath only on the evidence that one is playing', () => {
    const breathing = ROUTINE.find((step) => step.action === 'breathing');
    if (!breathing) throw new Error('the routine has no breathing step');
    expect(stepDetail(breathing, true)).toBe(breathing.soundDetail);
    expect(stepDetail(breathing, false)).toBe(breathing.detail);
  });

  it('keeps every unconditional detail true of a night where nothing was opened', () => {
    // The rule rather than the string: a `detail` is what a step says before anything is
    // known about the player, so a claim about a sound belongs in `soundDetail` or nowhere.
    // A step added later that mentions one fails here until it is moved.
    for (const step of ROUTINE) {
      expect(stepDetail(step, false)).not.toMatch(/\bsound\b/i);
    }
  });

  it('says more about a playing sound than it does about none, where it says anything', () => {
    // A second reading that matches the first is a copy waiting to drift.
    for (const step of ROUTINE) {
      if (step.soundDetail === undefined) continue;
      expect(step.soundDetail).not.toBe(step.detail);
      expect(step.soundDetail).toMatch(/\bsound\b/i);
    }
  });

  it('falls back to the one reading for a step that has no second', () => {
    const plain = ROUTINE.filter((step) => step.soundDetail === undefined);
    expect(plain.length).toBeGreaterThan(0);
    for (const step of plain) {
      expect(stepDetail(step, true)).toBe(step.detail);
    }
  });

  it('carries no emoji', () => {
    // The redesign replaced them with numerals throughout.
    const text = ROUTINE.map(
      (step) => `${step.title} ${step.detail} ${step.soundDetail ?? ''}`
    ).join(' ');
    expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});

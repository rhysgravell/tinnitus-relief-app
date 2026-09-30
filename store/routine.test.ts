import { BREATHING_MINUTES, ROUTINE } from './routine';

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

  it('carries no emoji', () => {
    // The redesign replaced them with numerals throughout.
    const text = ROUTINE.map((step) => `${step.title} ${step.detail}`).join(' ');
    expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});

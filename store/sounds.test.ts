import { findSound, isPlayable, SOUNDS, soundsInCategory } from './sounds';

describe('sound catalogue', () => {
  it('gives every sound a unique id', () => {
    const ids = SOUNDS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every sound artwork', () => {
    // A card with no artwork is a hole in the grid, so this is not optional.
    for (const sound of SOUNDS) {
      expect(sound.artwork).toBeTruthy();
    }
  });

  it('gives every sound a name and a descriptor', () => {
    for (const sound of SOUNDS) {
      expect(sound.name).not.toBe('');
      expect(sound.descriptor).not.toBe('');
    }
  });

  it('leaves no filter chip empty', () => {
    // The Sounds screen shows a chip per category. A chip that filters to nothing looks
    // broken, so each one has to have at least one sound behind it.
    for (const category of ['rain', 'nature', 'noise'] as const) {
      expect(soundsInCategory(category).length).toBeGreaterThan(0);
    }
  });

  it('returns everything for the All filter', () => {
    expect(soundsInCategory('all')).toHaveLength(SOUNDS.length);
  });

  it('finds a sound by id', () => {
    expect(findSound('underwater')?.name).toBe('Underwater');
  });

  it('returns undefined for an unknown id', () => {
    expect(findSound('nope')).toBeUndefined();
  });

  it('treats a sound as playable exactly when it has audio', () => {
    for (const sound of SOUNDS) {
      expect(isPlayable(sound)).toBe(sound.file !== null);
    }
  });
});

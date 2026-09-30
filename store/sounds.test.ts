import {
  findSound,
  isPlayable,
  SOUND_FILTERS,
  SOUNDS,
  soundsInCategory,
  spokenDescriptor,
} from './sounds';
import type { Sound } from './sounds';

function sound(id: string): Sound {
  const found = findSound(id);
  if (!found) throw new Error(`${id} is not in the catalogue`);
  return found;
}

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

describe('spokenDescriptor', () => {
  it('pauses where the middle dot is, since it is read as nothing at all', () => {
    expect(spokenDescriptor(sound('underwater'))).toBe('Low-pass, deep');
  });

  it('leaves no middle dot in any descriptor the catalogue ships', () => {
    // Derived rather than authored, so a sound added later is covered by this on arrival.
    for (const entry of SOUNDS) {
      expect(spokenDescriptor(entry)).not.toContain('·');
      expect(spokenDescriptor(entry)).not.toBe('');
    }
  });

  it('says why a sound cannot be played, where the card only says when', () => {
    // `rain-on-canvas` ships with artwork but no audio file, and reads "Coming soon".
    expect(spokenDescriptor(sound('rain-on-canvas'))).toBe('No recording for this one yet');
  });

  it('describes a sound only while there is something to hear', () => {
    for (const entry of SOUNDS) {
      const describesTheSound = spokenDescriptor(entry) !== 'No recording for this one yet';
      expect(describesTheSound).toBe(isPlayable(entry));
    }
  });
});

describe('filter row', () => {
  it('leads with All', () => {
    expect(SOUND_FILTERS[0]).toEqual({ value: 'all', label: 'All' });
  });

  it('offers a chip for every category a sound uses', () => {
    // A category with no chip is a sound the user cannot filter down to.
    const chips = SOUND_FILTERS.map((filter) => filter.value);
    for (const sound of SOUNDS) {
      expect(chips).toContain(sound.category);
    }
  });

  it('offers no chip that filters to nothing', () => {
    for (const { value } of SOUND_FILTERS) {
      expect(soundsInCategory(value).length).toBeGreaterThan(0);
    }
  });
});

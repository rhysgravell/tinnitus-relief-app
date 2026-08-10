import { savedMeta, savedSounds } from './saved';
import type { SavedSound } from './saved';
import { findSound } from './sounds';
import { DEFAULT_SOUND_STATE } from './soundState';
import type { SoundState, SoundStates } from './soundState';

/** A saved sound's state, with only the parts a test cares about spelled out. */
function saved(patch: Partial<SoundState> = {}): SoundState {
  return { ...DEFAULT_SOUND_STATE, saved: true, ...patch };
}

function states(entries: Record<string, Partial<SoundState>>): SoundStates {
  return Object.fromEntries(Object.entries(entries).map(([id, patch]) => [id, saved(patch)]));
}

function entry(id: string, patch: Partial<SoundState> = {}, mostPlayed = false): SavedSound {
  const sound = findSound(id);
  if (!sound) throw new Error(`${id} is not in the catalogue`);
  return { sound, state: saved(patch), mostPlayed };
}

function names(list: SavedSound[]): string[] {
  return list.map(({ sound }) => sound.name);
}

describe('savedSounds', () => {
  it('lists nothing for a user who has saved nothing', () => {
    expect(savedSounds({})).toEqual([]);
  });

  it('leaves out a sound that was saved and then unsaved', () => {
    const withUnsaved: SoundStates = {
      underwater: saved(),
      'at-the-beach': { ...DEFAULT_SOUND_STATE, saved: false, sessionCount: 9 },
    };
    expect(names(savedSounds(withUnsaved))).toEqual(['Underwater']);
  });

  it('puts the most-played sound at the top', () => {
    const list = savedSounds(
      states({
        underwater: { sessionCount: 2 },
        'at-the-beach': { sessionCount: 14 },
        'evening-forest': { sessionCount: 6 },
      })
    );
    expect(names(list)).toEqual(['At the Beach', 'Evening Forest', 'Underwater']);
  });

  it('keeps catalogue order between sounds used the same amount', () => {
    // Otherwise the list would reshuffle from one visit to the next for no reason the
    // user could see.
    const list = savedSounds(
      states({ 'evening-forest': { sessionCount: 3 }, 'fire-and-rain': { sessionCount: 3 } })
    );
    expect(names(list)).toEqual(['Fire and Rain', 'Evening Forest']);
  });

  it('marks a clear favourite as the most-played', () => {
    const list = savedSounds(
      states({ underwater: { sessionCount: 14 }, 'at-the-beach': { sessionCount: 6 } })
    );
    expect(list[0].mostPlayed).toBe(true);
    expect(list[1].mostPlayed).toBe(false);
  });

  it('names no favourite when the top two are tied', () => {
    const list = savedSounds(
      states({ underwater: { sessionCount: 6 }, 'at-the-beach': { sessionCount: 6 } })
    );
    expect(list.every(({ mostPlayed }) => !mostPlayed)).toBe(true);
  });

  it('names no favourite when only one sound is saved', () => {
    // "Your most-played" out of one is not a fact about the user.
    const list = savedSounds(states({ underwater: { sessionCount: 20 } }));
    expect(list[0].mostPlayed).toBe(false);
  });

  it('names no favourite before anything has been played', () => {
    const list = savedSounds(states({ underwater: {}, 'at-the-beach': {} }));
    expect(list.every(({ mostPlayed }) => !mostPlayed)).toBe(true);
  });

  it('falls back to the defaults for a saved sound with no other state', () => {
    const list = savedSounds({ underwater: { ...DEFAULT_SOUND_STATE, saved: true } });
    expect(list[0].state.lastTimerMinutes).toBe(DEFAULT_SOUND_STATE.lastTimerMinutes);
  });

  it('drops a saved sound that has left the catalogue', () => {
    // Sounds an earlier build shipped are still in a returning user's storage.
    expect(savedSounds(states({ 'peaceful-morning': { sessionCount: 4 } }))).toEqual([]);
  });
});

describe('savedMeta', () => {
  it('counts the sessions and names the timer they ran on', () => {
    expect(savedMeta(entry('evening-forest', { sessionCount: 14, lastTimerMinutes: 30 }))).toBe(
      '14 sessions · 30m'
    );
  });

  it('writes a single session in the singular', () => {
    expect(savedMeta(entry('underwater', { sessionCount: 1 }))).toBe('1 session · 45m');
  });

  it('leads with the favourite instead of its count', () => {
    expect(
      savedMeta(entry('underwater', { sessionCount: 40, lastTimerMinutes: 45 }, true))
    ).toBe('Your most-played · 45m');
  });

  it('says a session ran without a timer rather than showing the infinity glyph', () => {
    // "14 sessions · ∞" reads as a puzzle in the middle of a sentence.
    expect(savedMeta(entry('underwater', { sessionCount: 3, lastTimerMinutes: null }))).toBe(
      '3 sessions · no timer'
    );
  });

  it('promises no timer for a sound that has been saved but never played', () => {
    // Its session opens on the default from Settings, not on the untouched value here.
    expect(savedMeta(entry('underwater', { sessionCount: 0 }))).toBe('Not played yet');
  });

  it('says a sound with no recording is coming, the same as the grid does', () => {
    expect(savedMeta(entry('rain-on-canvas', { sessionCount: 0 }))).toBe('Coming soon');
  });
});

import { DEFAULT_SOUND_STATE } from './soundState';
import type { SoundState, SoundStates } from './soundState';
import { tonightSound, tonightSummary } from './tonight';
import { findSound } from './sounds';
import type { Session } from './sessions';

function saved(patch: Partial<SoundState> = {}): SoundState {
  return { ...DEFAULT_SOUND_STATE, saved: true, ...patch };
}

function states(entries: Record<string, Partial<SoundState>>): SoundStates {
  return Object.fromEntries(Object.entries(entries).map(([id, patch]) => [id, saved(patch)]));
}

function session(soundId: string): Session {
  return { soundId, endedAt: new Date().toISOString(), durationMinutes: 30, timerMinutes: 45 };
}

function sound(id: string) {
  const found = findSound(id);
  if (!found) throw new Error(`${id} is not in the catalogue`);
  return found;
}

describe('tonightSound', () => {
  it("offers last night's sound before anything else", () => {
    expect(tonightSound(session('underwater'), {})?.id).toBe('underwater');
  });

  it('falls back to the saved sound played most when there is no history', () => {
    const list = states({
      'evening-forest': { sessionCount: 2 },
      'at-the-beach': { sessionCount: 9 },
    });
    expect(tonightSound(null, list)?.id).toBe('at-the-beach');
  });

  it('falls back again to something that will simply play', () => {
    // A first-run user has neither a session nor a saved sound, and the card still has to
    // name something.
    const chosen = tonightSound(null, {});
    expect(chosen).toBeDefined();
    expect(chosen?.file).not.toBeNull();
  });

  it("skips last night's sound if it has left the catalogue", () => {
    expect(tonightSound(session('peaceful-morning'), {})?.id).not.toBe('peaceful-morning');
  });

  it("skips last night's sound if it has no recording", () => {
    expect(tonightSound(session('rain-on-canvas'), {})?.id).not.toBe('rain-on-canvas');
  });

  it('skips a saved sound with no recording', () => {
    const list = states({ 'rain-on-canvas': { sessionCount: 40 } });
    expect(tonightSound(null, list)?.id).not.toBe('rain-on-canvas');
  });
});

describe('tonightSummary', () => {
  it('gives the length and the sound', () => {
    expect(tonightSummary(sound('underwater'), 45)).toBe('45 min · Underwater');
  });

  it('says there is no timer rather than showing the infinity glyph', () => {
    expect(tonightSummary(sound('underwater'), null)).toBe('No timer · Underwater');
  });

  it('says so when there is nothing to play', () => {
    expect(tonightSummary(undefined, 45)).toBe('No sounds available to play');
  });
});

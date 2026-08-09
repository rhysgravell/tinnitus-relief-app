import { FONT_ASSETS } from './fonts';
import { CHART_RAMP, COLORS, FONT, OVERLAY, RADIUS, SPACE, TYPE } from './tokens';

describe('colour palettes', () => {
  it('defines the same keys for light and dark', () => {
    // A component reads palette keys without knowing the scheme, so a key present in
    // one palette and missing from the other would render `undefined` at runtime.
    expect(Object.keys(COLORS.dark).sort()).toEqual(Object.keys(COLORS.light).sort());
  });

  it.each(['light', 'dark'] as const)('only contains valid colours in %s', (scheme) => {
    for (const [key, value] of Object.entries(COLORS[scheme])) {
      if (key === 'backgroundGradient') continue;
      expect(value).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it('gives the night surfaces a gradient and the light surfaces none', () => {
    expect(COLORS.light.backgroundGradient).toBeNull();
    expect(COLORS.dark.backgroundGradient).toEqual(['#16292C', '#0E1A1B']);
  });

  it('ends the dark gradient on the dark background colour', () => {
    // The gradient stops at 46–58% of the screen, so anything below it is painted with
    // `background` — the two have to agree or there is a visible seam.
    expect(COLORS.dark.backgroundGradient?.[1]).toBe(COLORS.dark.background);
  });
});

describe('pills', () => {
  it('keeps the pill label a step off the body colour in both palettes', () => {
    // An unselected pill's label is lighter than body text in light and lighter than the
    // muted text in night — it is a control, not copy.
    expect(COLORS.light.pillLabel).not.toBe(COLORS.light.text);
    expect(COLORS.dark.pillLabel).not.toBe(COLORS.dark.textMuted);
  });

  it('changes only the weight of the label across the pill states', () => {
    const states = [TYPE.bodySecondary, TYPE.pillLabelSelected, TYPE.pillLabelStrong];
    for (const state of states) {
      expect(state.fontSize).toBe(14);
      expect(state.lineHeight).toBe(21);
    }
    expect(new Set(states.map((s) => s.fontFamily)).size).toBe(3);
  });
});

describe('typography', () => {
  it('only uses font families that are actually loaded', () => {
    // A family name that is not a key of FONT_ASSETS silently falls back to the system
    // font instead of erroring, which is easy to miss by eye.
    const loaded = Object.keys(FONT_ASSETS);
    for (const family of Object.values(FONT)) {
      expect(loaded).toContain(family);
    }
  });

  it.each(Object.entries(TYPE))('gives %s a family from the token set', (_role, style) => {
    expect(Object.values(FONT)).toContain(style.fontFamily);
  });

  it.each(Object.entries(TYPE))('gives %s a line height at least its font size', (_role, style) => {
    expect(style.lineHeight).toBeGreaterThanOrEqual(style.fontSize);
  });

  it('does not set fontWeight alongside a custom family', () => {
    // Weight is baked into the family; setting both makes Android synthesise a bolder
    // face on top of an already-bold file.
    for (const style of Object.values(TYPE)) {
      expect(style).not.toHaveProperty('fontWeight');
    }
  });
});

describe('scales', () => {
  it('names every spacing step after its value', () => {
    for (const [key, value] of Object.entries(SPACE)) {
      expect(key).toBe(`s${value}`);
    }
  });

  it('keeps the spacing scale ascending', () => {
    const values = Object.values(SPACE);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });

  it('uses a fully round pill radius', () => {
    expect(RADIUS.pill).toBe(999);
  });

  it('ramps the chart tints across four steps ending on the primary green', () => {
    expect(CHART_RAMP).toHaveLength(4);
    expect(CHART_RAMP[CHART_RAMP.length - 1]).toBe(COLORS.light.primary);
  });
});

describe('artwork overlay', () => {
  it('keeps the chip translucent so the artwork reads through it', () => {
    expect(OVERLAY.chip).toMatch(/^rgba\(/);
  });

  it('marks a saved star in the accent green', () => {
    expect(OVERLAY.starSaved).toBe(COLORS.light.primary);
  });

  it('sits the idle star lighter than the saved one', () => {
    // Both have to hold their own on a photograph, so the difference is lightness rather
    // than the fill-versus-outline contrast a flat surface could rely on.
    expect(OVERLAY.starIdle).not.toBe(OVERLAY.starSaved);
    expect(OVERLAY.starIdle).toMatch(/^#[0-9A-F]{6}$/);
  });
});

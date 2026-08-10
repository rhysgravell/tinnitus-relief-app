/**
 * Design tokens for the Quiet redesign.
 *
 * Values are transcribed from the design handoff and are intended to be the single
 * source of truth — screens and components should never hardcode a colour, radius,
 * font family or spacing value.
 */

/**
 * Font family names. These must match the keys passed to `useFonts` in
 * `theme/fonts.ts`, since that key becomes the registered family name.
 *
 * Weight is baked into the family (the usual approach for custom fonts on RN) so
 * roles below set `fontFamily` and never `fontWeight` — setting both makes Android
 * synthesise a bolder face on top of an already-bold file.
 */
export const FONT = {
  serif: 'Newsreader_400Regular',
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
  mono: 'DMMono_400Regular',
} as const;

export type Palette = {
  /** Screen background. */
  background: string;
  /** Top-to-bottom gradient for the night surfaces; null where the design is flat. */
  backgroundGradient: readonly [string, string] | null;
  /** Cards. */
  surface: string;
  /** Info cards and secondary buttons. */
  surfaceAlt: string;
  /** Primary buttons, active tab, accents. */
  primary: string;
  /** Text and glyphs sitting on `primary`. */
  onPrimary: string;
  /** Headings and body copy. */
  text: string;
  /** Subtitles and descriptions. */
  textMuted: string;
  /** Card meta lines. */
  textFaint: string;
  /** Labels and tertiary text. */
  textSubtle: string;
  /** The label on an unselected pill — a step lighter than `text`. */
  pillLabel: string;
  /** Row separators inside cards, tab bar top edge. */
  hairline: string;
  /** The lighter separator used between rows of a settings card. */
  hairlineInner: string;
  /** Card borders. */
  border: string;
  /** Unselected pills and outline buttons. */
  borderStrong: string;
  /** Slider tracks and off toggles. */
  track: string;
  /** Outer breathing ring. */
  ringOuter: string;
  /** Inner breathing ring. */
  ringInner: string;
};

const light: Palette = {
  background: '#EFF3F1',
  backgroundGradient: null,
  surface: '#FFFFFF',
  surfaceAlt: '#F7FAF8',
  primary: '#3F6B5C',
  onPrimary: '#F4F8F6',
  text: '#16211F',
  textMuted: '#5F726D',
  textFaint: '#7C8C88',
  textSubtle: '#8A9995',
  pillLabel: '#3D4E4A',
  hairline: '#DCE4E1',
  hairlineInner: '#E7EDEA',
  border: '#DCE4E1',
  borderStrong: '#CDD8D4',
  track: '#D6E0DC',
  ringOuter: '#C9DBD2',
  ringInner: '#A8C6BA',
};

/**
 * The night palette. Note that dark collapses `textFaint` and `textSubtle` onto a
 * single value — the handoff only specifies two muted levels for the night surfaces.
 */
const dark: Palette = {
  background: '#0E1A1B',
  backgroundGradient: ['#16292C', '#0E1A1B'],
  surface: '#17262A',
  surfaceAlt: '#22383A',
  primary: '#8FB3A4',
  onPrimary: '#0E1A1B',
  text: '#EAF1EE',
  textMuted: '#8FA3A0',
  textFaint: '#6F8582',
  textSubtle: '#6F8582',
  pillLabel: '#A9BCB8',
  hairline: '#1E3133',
  hairlineInner: '#1E3133',
  border: '#253C3E',
  borderStrong: '#2E4749',
  track: '#243A3C',
  ringOuter: '#2C4A4B',
  ringInner: '#3C6260',
};

export const COLORS = { light, dark } as const;

export type Scheme = keyof typeof COLORS;

/**
 * Check-in trend bars are tinted by recency, oldest to newest, so the eye reads
 * direction without needing a legend.
 */
export const CHART_RAMP = ['#C6D6CF', '#A6C2B6', '#7FA795', '#3F6B5C'] as const;

/**
 * Colours for controls that sit on artwork rather than on a surface. They are outside the
 * palette on purpose: the photograph underneath does not change with the scheme, so a
 * saved star has to stay legible whichever palette the screen is using.
 */
export const OVERLAY = {
  /** The chip behind the star, translucent so the artwork still reads through it. */
  chip: 'rgba(255, 255, 255, 0.85)',
  starSaved: '#3F6B5C',
  starIdle: '#9BA9A6',
} as const;

/**
 * The spacing scale. Keys are the values, so an off-scale number stands out in review.
 */
export const SPACE = {
  s2: 2,
  s3: 3,
  s4: 4,
  s6: 6,
  s8: 8,
  s10: 10,
  s12: 12,
  s14: 14,
  s16: 16,
  s18: 18,
  s20: 20,
  s24: 24,
  s26: 26,
  s30: 30,
  s34: 34,
  s40: 40,
  s44: 44,
} as const;

export const LAYOUT = {
  screenGutter: 20,
  cardPadding: 16,
  cardPaddingLarge: 18,
  /** Minimum tap area, applied via hitSlop where the visual target is smaller. */
  minTouchTarget: 44,
  hairlineWidth: 1,
} as const;

/** Radii are per-component on purpose — the design never mixes radii within a group. */
export const RADIUS = {
  tabSquare: 5,
  thumbnail: 11,
  secondaryButton: 12,
  card: 14,
  hero: 18,
  pill: 999,
} as const;

/** Separation is always a hairline. There are no shadows in this design. */
export const MOTION = {
  /** All state changes and transitions. Nothing bounces, nothing springs. */
  transitionMs: 240,
  /** The breathing rings — the only continuous animation in the app. */
  breathingMs: 6000,
} as const;

export type TypeRole = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  textTransform?: 'uppercase';
};

/**
 * Type roles. Colour is deliberately absent — it comes from the palette at render
 * time, so a role can be used on both the light and night surfaces.
 */
export const TYPE = {
  screenTitle: { fontFamily: FONT.serif, fontSize: 31, lineHeight: 37 },
  screenSubtitle: { fontFamily: FONT.sans, fontSize: 15, lineHeight: 23 },
  sessionTitle: { fontFamily: FONT.serif, fontSize: 29, lineHeight: 35 },
  cardTitleHero: { fontFamily: FONT.serif, fontSize: 24, lineHeight: 29 },
  emptyTitle: { fontFamily: FONT.serif, fontSize: 23, lineHeight: 29 },
  cardTitleLarge: { fontFamily: FONT.sansSemiBold, fontSize: 19, lineHeight: 24 },
  rowTitle: { fontFamily: FONT.sansSemiBold, fontSize: 16, lineHeight: 21 },
  buttonLabel: { fontFamily: FONT.sansSemiBold, fontSize: 16, lineHeight: 21 },
  // The 15pt semibold title, on a grid card and on the info cards alike. Named for its
  // size rather than for the grid, since the design reuses it in seven places.
  cardTitleSmall: { fontFamily: FONT.sansSemiBold, fontSize: 15, lineHeight: 20 },
  // Pills carry the label's weight rather than its size: 14px throughout, 400 when
  // unselected (`bodySecondary`), 500 once filled, and 600 for the session timer.
  pillLabelSelected: { fontFamily: FONT.sansMedium, fontSize: 14, lineHeight: 21 },
  pillLabelStrong: { fontFamily: FONT.sansSemiBold, fontSize: 14, lineHeight: 21 },
  body: { fontFamily: FONT.sans, fontSize: 15, lineHeight: 23 },
  bodySecondary: { fontFamily: FONT.sans, fontSize: 14, lineHeight: 21 },
  meta: { fontFamily: FONT.sans, fontSize: 13, lineHeight: 18 },
  tabLabel: { fontFamily: FONT.sans, fontSize: 11, lineHeight: 14 },
  tabLabelActive: { fontFamily: FONT.sansSemiBold, fontSize: 11, lineHeight: 14 },
  // Tracking is expressed in em in the handoff; React Native takes points, so these
  // are the em value multiplied by the font size.
  sectionLabel: {
    fontFamily: FONT.mono,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  sectionLabelLarge: {
    fontFamily: FONT.mono,
    fontSize: 13,
    lineHeight: 17,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  monoCaption: { fontFamily: FONT.mono, fontSize: 12, lineHeight: 16, letterSpacing: 1.4 },
  readout: { fontFamily: FONT.mono, fontSize: 34, lineHeight: 37 },
} as const satisfies Record<string, TypeRole>;

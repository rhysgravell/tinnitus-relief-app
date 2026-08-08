import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { COLORS } from './tokens';
import type { Palette, Scheme } from './tokens';

export type Theme = {
  scheme: Scheme;
  colors: Palette;
};

const LIGHT_THEME: Theme = { scheme: 'light', colors: COLORS.light };

const ThemeContext = createContext<Theme>(LIGHT_THEME);

type Props = {
  scheme: Scheme;
  children: ReactNode;
};

/**
 * Provides the active palette. Nesting is intended: the root provides the app-wide
 * scheme, and the permanently-dark screens (Session, Sleep) wrap themselves in their
 * own dark provider so they stay dark regardless of what the root is doing.
 */
export function ThemeProvider({ scheme, children }: Props) {
  const value = useMemo<Theme>(() => ({ scheme, colors: COLORS[scheme] }), [scheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Returns the active theme. Defaults to light outside a provider rather than
 * throwing, so components can be unit tested without a wrapper.
 */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}

import { render, screen } from '@testing-library/react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import RootLayout from '../../app/_layout';

// This test lives outside `app/` on purpose. Expo Router turns every file under the
// app directory into a route — its context filter only excludes `+api`, `+html`,
// `+middleware` and `+native-intent` — so a colocated `.test.tsx` gets bundled into
// the app, pulling the test library and its Node `console` dependency into the
// runtime bundle. See the guard in ./routes.test.ts.

jest.mock('expo-font', () => ({ useFonts: jest.fn() }));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

/* eslint-disable @typescript-eslint/no-require-imports -- a jest.mock factory is hoisted above the imports, so it cannot close over them */
jest.mock('expo-router', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Stack: () => React.createElement(Text, { testID: 'stack' }, 'stack'),
  };
});
/* eslint-enable @typescript-eslint/no-require-imports */

const mockUseFonts = jest.mocked(useFonts);

/** `useFonts` returns [loaded, error]. */
function fontState(loaded: boolean, error: Error | null = null) {
  mockUseFonts.mockReturnValue([loaded, error]);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('RootLayout', () => {
  it('renders nothing while the fonts are still loading', () => {
    fontState(false);
    render(<RootLayout />);
    expect(screen.queryByTestId('stack')).toBeNull();
  });

  it('keeps the splash up while the fonts are still loading', () => {
    fontState(false);
    render(<RootLayout />);
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  });

  it('renders the navigator once the fonts are loaded', () => {
    fontState(true);
    render(<RootLayout />);
    expect(screen.getByTestId('stack')).toBeTruthy();
  });

  it('hides the splash once the fonts are loaded', () => {
    fontState(true);
    render(<RootLayout />);
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it('renders anyway when font loading fails', () => {
    // Falling back to system fonts is worse than the design intends, but sitting on
    // the splash screen forever is worse still.
    fontState(false, new Error('no network'));
    render(<RootLayout />);
    expect(screen.getByTestId('stack')).toBeTruthy();
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });
});

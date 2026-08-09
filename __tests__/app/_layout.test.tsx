import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import RootLayout from '../../app/_layout';

// This test lives outside `app/` on purpose. Expo Router turns every file under the
// app directory into a route — its context filter only excludes `+api`, `+html`,
// `+middleware` and `+native-intent` — so a colocated `.test.tsx` gets bundled into
// the app, pulling the test library and its Node `console` dependency into the
// runtime bundle. See the guard in ./routes.test.ts.

jest.mock('expo-font', () => ({ useFonts: jest.fn() }));

// The layout wraps the navigator in the sound-state provider, which reads storage as it
// mounts. That read is not what these tests are about, so the provider is a passthrough.
jest.mock('../../context/SoundStateContext', () => ({
  SoundStateProvider: function SoundStateProvider({ children }: { children?: ReactNode }) {
    return children;
  },
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

/* eslint-disable @typescript-eslint/no-require-imports -- a jest.mock factory is hoisted above the imports, so it cannot close over them */
jest.mock('expo-router', () => {
  const React = require('react');
  const { Text, View } = require('react-native');

  // Each registered screen renders its options, so the tests can assert how a route is
  // presented without standing up a real navigator.
  const Stack = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, { testID: 'stack' }, children);
  const Screen = ({ name, options }: { name: string; options?: object }) =>
    React.createElement(Text, { testID: `screen-${name}` }, JSON.stringify(options ?? {}));
  Screen.displayName = 'Stack.Screen';
  Stack.Screen = Screen;

  return { Stack };
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

  it('registers the tabs alongside the two screens that sit outside them', () => {
    // Session is a modal over the tab bar and Settings is a push; neither is a fifth tab.
    fontState(true);
    render(<RootLayout />);
    expect(screen.getByTestId('screen-(tabs)')).toBeTruthy();
    expect(screen.getByTestId('screen-session')).toBeTruthy();
    expect(screen.getByTestId('screen-settings')).toBeTruthy();
  });

  it('presents the session as a modal so it can be swiped away', () => {
    fontState(true);
    render(<RootLayout />);
    expect(screen.getByTestId('screen-session').props.children).toContain('"presentation":"modal"');
  });

  it('pushes settings rather than presenting it', () => {
    fontState(true);
    render(<RootLayout />);
    expect(screen.getByTestId('screen-settings').props.children).not.toContain('presentation');
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

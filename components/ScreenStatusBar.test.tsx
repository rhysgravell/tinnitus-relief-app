import { act, render, screen } from '@testing-library/react-native';
import { useFocusEffect } from 'expo-router';
import { ScreenStatusBar } from './ScreenStatusBar';
import { ThemeProvider } from '../theme/ThemeProvider';

// The real hook needs a navigator. This stand-in hands the focus callback back so a test
// can focus the screen and blur it again.
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));

/* eslint-disable @typescript-eslint/no-require-imports -- a jest.mock factory is hoisted above the imports, so it cannot close over them */
// The real status bar renders nothing to find. This one puts the ink colour on screen.
jest.mock('expo-status-bar', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    StatusBar: ({ style }: { style: string }) =>
      React.createElement(Text, { testID: 'status-bar' }, style),
  };
});
/* eslint-enable @typescript-eslint/no-require-imports */

/** The screen coming into view, and going out of it again. */
let focus: () => void;
let blur: () => void;

beforeEach(() => {
  jest.mocked(useFocusEffect).mockImplementation((callback) => {
    focus = () => {
      const cleanup = callback();
      blur = () => cleanup?.();
    };
  });
});

/** Renders under a palette, and tells the screen it is the one being looked at. */
function renderFocused(scheme: 'light' | 'dark') {
  render(
    <ThemeProvider scheme={scheme}>
      <ScreenStatusBar />
    </ThemeProvider>
  );
  act(() => focus());
}

function ink() {
  return screen.queryByTestId('status-bar')?.props.children ?? null;
}

describe('ScreenStatusBar', () => {
  it('draws in light ink on a night surface', () => {
    renderFocused('dark');
    expect(ink()).toBe('light');
  });

  it('draws in dark ink on a day surface', () => {
    renderFocused('light');
    expect(ink()).toBe('dark');
  });

  it('says nothing until the screen is the one being looked at', () => {
    // Sleep is a tab, so it is mounted long before it is looked at.
    render(
      <ThemeProvider scheme="dark">
        <ScreenStatusBar />
      </ThemeProvider>
    );
    expect(ink()).toBeNull();
  });

  it('hands the status bar back on the way out', () => {
    // A tab screen stays mounted after you leave it. White ink left standing over the day
    // screens would be worse than the problem this fixes.
    renderFocused('dark');
    act(() => blur());
    expect(ink()).toBeNull();
  });

  it('takes it again when the screen is returned to', () => {
    renderFocused('dark');
    act(() => blur());
    act(() => focus());
    expect(ink()).toBe('light');
  });
});

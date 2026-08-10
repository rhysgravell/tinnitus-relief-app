import { render, screen } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';
import { ScreenBackground } from './ScreenBackground';
import { ThemeProvider } from '../theme/ThemeProvider';
import { COLORS } from '../theme/tokens';
import type { Scheme } from '../theme/tokens';

function renderIn(scheme: Scheme, gradientStop?: number) {
  render(
    <ThemeProvider scheme={scheme}>
      <ScreenBackground testID="ground" gradientStop={gradientStop}>
        <Text>Session</Text>
      </ScreenBackground>
    </ThemeProvider>
  );
  return StyleSheet.flatten(screen.getByTestId('ground').props.style) as Record<string, unknown>;
}

describe('ScreenBackground', () => {
  it('paints the palette background flat on a light screen', () => {
    const style = renderIn('light');
    expect(style.backgroundColor).toBe(COLORS.light.background);
    expect(style.experimental_backgroundImage).toBeUndefined();
  });

  it('lays the night gradient over the background on a dark screen', () => {
    const style = renderIn('dark');
    expect(style.experimental_backgroundImage).toBe(
      'linear-gradient(180deg, #16292C 0%, #0E1A1B 58%)'
    );
  });

  it('keeps the flat background underneath the gradient', () => {
    // The gradient style is still experimental. A runtime that ignores it should land on
    // the right dark green rather than on nothing.
    const style = renderIn('dark');
    expect(style.backgroundColor).toBe(COLORS.dark.background);
  });

  it('takes the stop where the design puts it', () => {
    const style = renderIn('dark', 46);
    expect(style.experimental_backgroundImage).toContain('#0E1A1B 46%');
  });

  it('renders its children', () => {
    renderIn('dark');
    expect(screen.getByText('Session')).toBeTruthy();
  });
});

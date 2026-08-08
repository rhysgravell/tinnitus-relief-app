import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider, useTheme } from './ThemeProvider';
import { COLORS } from './tokens';

function Probe() {
  const { scheme, colors } = useTheme();
  return <Text testID="probe">{`${scheme}:${colors.background}`}</Text>;
}

describe('ThemeProvider', () => {
  it('defaults to light outside a provider', () => {
    render(<Probe />);
    expect(screen.getByTestId('probe')).toHaveTextContent(`light:${COLORS.light.background}`);
  });

  it.each(['light', 'dark'] as const)('provides the %s palette', (scheme) => {
    render(
      <ThemeProvider scheme={scheme}>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId('probe')).toHaveTextContent(`${scheme}:${COLORS[scheme].background}`);
  });

  it('lets a nested provider override the scheme', () => {
    // Session and Sleep stay dark regardless of the app-wide scheme.
    render(
      <ThemeProvider scheme="light">
        <ThemeProvider scheme="dark">
          <Probe />
        </ThemeProvider>
      </ThemeProvider>
    );
    expect(screen.getByTestId('probe')).toHaveTextContent(`dark:${COLORS.dark.background}`);
  });
});

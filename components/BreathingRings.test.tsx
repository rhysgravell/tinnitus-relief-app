import { render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, StyleSheet, Text as RNText } from 'react-native';
import { BreathingRings } from './BreathingRings';
import { ThemeProvider } from '../theme/ThemeProvider';
import { COLORS } from '../theme/tokens';

function ringStyle(which: 'outer' | 'inner') {
  return StyleSheet.flatten(screen.getByTestId(`breathing-ring-${which}`).props.style);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('BreathingRings', () => {
  it('draws two concentric circles at the design sizes', () => {
    render(<BreathingRings size={250} innerSize={180} />);
    expect(ringStyle('outer')).toMatchObject({ width: 250, height: 250, borderRadius: 125 });
    expect(ringStyle('inner')).toMatchObject({ width: 180, height: 180, borderRadius: 90 });
  });

  it('derives an inner ring roughly seven tenths of the outer one', () => {
    render(<BreathingRings size={250} />);
    expect(ringStyle('inner').width).toBe(180);
  });

  it('tints the rings from the palette', () => {
    render(
      <ThemeProvider scheme="dark">
        <BreathingRings />
      </ThemeProvider>
    );
    expect(ringStyle('outer').backgroundColor).toBe(COLORS.dark.ringOuter);
    expect(ringStyle('inner').backgroundColor).toBe(COLORS.dark.ringInner);
  });

  it('holds the readout in the middle', () => {
    render(
      <BreathingRings>
        <RNText>32:14</RNText>
      </BreathingRings>
    );
    expect(screen.getByText('32:14')).toBeTruthy();
  });

  it('stacks the rings behind the readout rather than in the layout', () => {
    // The readout is the only thing that takes part in layout; the rings are absolute so
    // their scaling never moves it.
    render(<BreathingRings />);
    expect(ringStyle('outer').position).toBe('absolute');
    expect(ringStyle('inner').position).toBe('absolute');
  });

  it('holds still when the OS asks for reduced motion', async () => {
    // A 6s animation that runs for the whole session is exactly what that setting is for.
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    render(<BreathingRings />);

    const frozen = await screen.findByTestId('breathing-ring-outer');
    // Frozen at the midpoint of the cycle, so it keeps the size it would have while
    // animating rather than collapsing to the contracted end.
    expect(Number(StyleSheet.flatten(frozen.props.style).opacity)).toBeCloseTo(0.46, 2);
  });
});

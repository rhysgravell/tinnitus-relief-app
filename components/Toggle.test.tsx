import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { Toggle } from './Toggle';
import { ThemeProvider } from '../theme/ThemeProvider';
import { COLORS, LAYOUT } from '../theme/tokens';

function knobStyle() {
  return StyleSheet.flatten(screen.getByTestId('toggle-knob').props.style);
}

describe('Toggle', () => {
  it('exposes itself as a switch with its label and state', () => {
    render(<Toggle value onValueChange={() => {}} accessibilityLabel="Fade out at the end" />);
    const toggle = screen.getByRole('switch', { name: 'Fade out at the end' });
    expect(toggle.props.accessibilityState).toMatchObject({ checked: true });
  });

  it('reports the flipped value rather than the current one', () => {
    const onValueChange = jest.fn();
    render(<Toggle value={false} onValueChange={onValueChange} accessibilityLabel="Fade out" />);
    fireEvent.press(screen.getByRole('switch'));
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('does not fire when disabled', () => {
    const onValueChange = jest.fn();
    render(
      <Toggle value={false} onValueChange={onValueChange} accessibilityLabel="Fade out" disabled />
    );
    fireEvent.press(screen.getByRole('switch'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('is 50 × 30 with a fully round track and a 24pt knob', () => {
    render(<Toggle value onValueChange={() => {}} accessibilityLabel="Fade out" />);
    const track = StyleSheet.flatten(screen.getByTestId('toggle-track').props.style);
    expect(track).toMatchObject({ width: 50, height: 30, borderRadius: 15, padding: 3 });
    expect(knobStyle()).toMatchObject({ width: 24, height: 24, borderRadius: 12 });
  });

  it('gives the knob a light fill on a light surface', () => {
    render(<Toggle value onValueChange={() => {}} accessibilityLabel="Fade out" />);
    expect(knobStyle().backgroundColor).toBe(COLORS.light.onPrimary);
  });

  it('gives the knob a light fill when off on a night surface', () => {
    // The handoff only shows a night toggle switched on, where the knob is the dark
    // background colour. Reusing that when off would hide the knob in the track.
    render(
      <ThemeProvider scheme="dark">
        <Toggle value={false} onValueChange={() => {}} accessibilityLabel="Wind-down" />
      </ThemeProvider>
    );
    expect(knobStyle().backgroundColor).toBe(COLORS.dark.textMuted);
  });

  it('mounts with the knob already in place rather than animating into it', () => {
    // Settings shows several switches at once; animating on mount would set the whole
    // screen moving as it appears.
    render(<Toggle value onValueChange={() => {}} accessibilityLabel="Fade out" />);
    const [{ translateX }] = knobStyle().transform as [{ translateX: number }];
    expect(Number(translateX)).toBe(20);
  });

  it('keeps the knob left when off', () => {
    render(<Toggle value={false} onValueChange={() => {}} accessibilityLabel="Fade out" />);
    const [{ translateX }] = knobStyle().transform as [{ translateX: number }];
    expect(Number(translateX)).toBe(0);
  });

  it('grows its hit area past the 44pt minimum', () => {
    render(<Toggle value onValueChange={() => {}} accessibilityLabel="Fade out" />);
    const slop = Number(screen.getByRole('switch').props.hitSlop);
    expect(30 + slop * 2).toBeGreaterThanOrEqual(LAYOUT.minTouchTarget);
  });
});

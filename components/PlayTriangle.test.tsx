import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { PlayTriangle } from './PlayTriangle';
import { ThemeProvider } from '../theme/ThemeProvider';
import { COLORS } from '../theme/tokens';

function triangleStyle() {
  return StyleSheet.flatten(screen.getByTestId('play-triangle').props.style) as Record<
    string,
    number
  >;
}

describe('PlayTriangle', () => {
  it('is drawn from borders, not from a glyph', () => {
    // This design ships no icon library — every glyph is a shape or a text character.
    render(<PlayTriangle />);
    const style = triangleStyle();
    expect(style).toMatchObject({ width: 0, height: 0 });
    expect(style.borderLeftWidth).toBeGreaterThan(0);
    expect(style.borderTopColor).toBe('transparent');
    expect(style.borderBottomColor).toBe('transparent');
  });

  it('matches the design proportions at both sizes', () => {
    render(<PlayTriangle size={16} />);
    expect(triangleStyle()).toMatchObject({ borderLeftWidth: 16, borderTopWidth: 10 });
  });

  it('keeps the smaller triangle in proportion too', () => {
    render(<PlayTriangle size={11} />);
    expect(triangleStyle()).toMatchObject({ borderLeftWidth: 11, borderTopWidth: 7 });
  });

  it('nudges itself right so it looks centred in a circle', () => {
    // A triangle's visual mass sits left of its bounding box, so geometric centring
    // reads as too far left.
    render(<PlayTriangle size={16} />);
    expect(triangleStyle().marginLeft).toBe(4);
  });

  it('sits flush when it is next to a label rather than in a circle', () => {
    render(<PlayTriangle size={11} nudge={false} />);
    expect(triangleStyle().marginLeft).toBe(0);
  });

  it('defaults to the accent of the active palette', () => {
    render(
      <ThemeProvider scheme="dark">
        <PlayTriangle />
      </ThemeProvider>
    );
    expect(triangleStyle().borderLeftColor).toBe(COLORS.dark.primary);
  });

  it('takes an explicit colour for the filled play button', () => {
    render(<PlayTriangle size={16} color={COLORS.light.onPrimary} />);
    expect(triangleStyle().borderLeftColor).toBe(COLORS.light.onPrimary);
  });
});

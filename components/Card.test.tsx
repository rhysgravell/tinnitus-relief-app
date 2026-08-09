import { render, screen } from '@testing-library/react-native';
import { StyleSheet, Text as RNText } from 'react-native';
import { Card } from './Card';
import { ThemeProvider } from '../theme/ThemeProvider';
import { COLORS, LAYOUT, RADIUS } from '../theme/tokens';

function styleOf(testID: string) {
  return StyleSheet.flatten(screen.getByTestId(testID).props.style);
}

describe('Card', () => {
  it('renders its children', () => {
    render(
      <Card>
        <RNText>Downloaded for offline</RNText>
      </Card>
    );
    expect(screen.getByText('Downloaded for offline')).toBeTruthy();
  });

  it('is a white surface with a hairline border and the card radius', () => {
    render(<Card testID="card" />);
    expect(styleOf('card')).toMatchObject({
      backgroundColor: COLORS.light.surface,
      borderColor: COLORS.light.border,
      borderWidth: LAYOUT.hairlineWidth,
      borderRadius: RADIUS.card,
      padding: LAYOUT.cardPadding,
    });
  });

  it('carries no shadow', () => {
    // Separation in this design is always the 1px border. A shadow would read as a
    // different app.
    render(<Card testID="card" />);
    const style = styleOf('card') as Record<string, unknown>;
    expect(style.shadowOpacity).toBeUndefined();
    expect(style.elevation).toBeUndefined();
  });

  it('takes the hero radius for the resume and Tonight cards', () => {
    render(<Card testID="card" variant="hero" />);
    expect(styleOf('card').borderRadius).toBe(RADIUS.hero);
  });

  it('uses the tinted fill for info cards', () => {
    render(<Card testID="card" tone="alt" />);
    expect(styleOf('card').backgroundColor).toBe(COLORS.light.surfaceAlt);
  });

  it('drops its padding when the content goes edge to edge', () => {
    render(<Card testID="card" padding={0} />);
    expect(styleOf('card').padding).toBe(0);
  });

  it('clips content only when asked, since full-bleed artwork needs it', () => {
    render(
      <>
        <Card testID="plain" />
        <Card testID="clipped" clip />
      </>
    );
    expect(styleOf('plain').overflow).toBeUndefined();
    expect(styleOf('clipped').overflow).toBe('hidden');
  });

  it('takes the night surface from the nearest provider', () => {
    render(
      <ThemeProvider scheme="dark">
        <Card testID="card" />
      </ThemeProvider>
    );
    expect(styleOf('card')).toMatchObject({
      backgroundColor: COLORS.dark.surface,
      borderColor: COLORS.dark.border,
    });
  });
});

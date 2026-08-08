import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { Text } from './Text';
import { ThemeProvider } from '../theme/ThemeProvider';
import { COLORS, FONT, TYPE } from '../theme/tokens';

function styleOf(text: string) {
  return StyleSheet.flatten(screen.getByText(text).props.style);
}

describe('Text', () => {
  it('renders its children', () => {
    render(<Text>Let&apos;s settle things</Text>);
    expect(screen.getByText("Let's settle things")).toBeTruthy();
  });

  it('defaults to the body variant', () => {
    render(<Text>Body</Text>);
    expect(styleOf('Body')).toMatchObject(TYPE.body);
  });

  it('applies the given variant from the type scale', () => {
    render(<Text variant="screenTitle">Sleep</Text>);
    expect(styleOf('Sleep')).toMatchObject({
      fontFamily: FONT.serif,
      fontSize: 31,
      lineHeight: 37,
    });
  });

  it('carries tracking and casing through for section labels', () => {
    render(<Text variant="sectionLabel">Tonight</Text>);
    expect(styleOf('Tonight')).toMatchObject({
      letterSpacing: TYPE.sectionLabel.letterSpacing,
      textTransform: 'uppercase',
    });
  });

  it('colours text from the active palette', () => {
    render(<Text tone="muted">Wind down for the night</Text>);
    expect(styleOf('Wind down for the night').color).toBe(COLORS.light.textMuted);
  });

  it('takes its colour from the nearest provider', () => {
    render(
      <ThemeProvider scheme="dark">
        <Text tone="muted">Wind down for the night</Text>
      </ThemeProvider>
    );
    expect(styleOf('Wind down for the night').color).toBe(COLORS.dark.textMuted);
  });

  it('sets no colour when the tone is inherited', () => {
    render(<Text tone="inherit">Inherited</Text>);
    expect(styleOf('Inherited').color).toBeUndefined();
  });

  it('lets a style prop win over the variant', () => {
    render(
      <Text variant="meta" style={{ fontSize: 99 }}>
        Override
      </Text>
    );
    expect(styleOf('Override').fontSize).toBe(99);
  });

  it('leaves the accessibility role prop usable', () => {
    // `variant` is deliberately not called `role`, so React Native's own role prop
    // still reaches the underlying Text.
    render(<Text role="heading">Heading</Text>);
    expect(screen.getByText('Heading').props.role).toBe('heading');
  });

  it('passes other Text props through', () => {
    render(<Text numberOfLines={2}>Truncated</Text>);
    expect(screen.getByText('Truncated').props.numberOfLines).toBe(2);
  });
});

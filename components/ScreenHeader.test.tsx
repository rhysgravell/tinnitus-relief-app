import { render, screen } from '@testing-library/react-native';
import { StyleSheet, Text as RNText } from 'react-native';
import { ScreenHeader } from './ScreenHeader';
import { ThemeProvider } from '../theme/ThemeProvider';
import { COLORS, FONT, LAYOUT, SPACE } from '../theme/tokens';

function styleOf(text: string) {
  return StyleSheet.flatten(screen.getByText(text).props.style);
}

describe('ScreenHeader', () => {
  it('renders the title in the serif display face', () => {
    render(<ScreenHeader title="Saved" />);
    expect(styleOf('Saved').fontFamily).toBe(FONT.serif);
  });

  it('renders a muted subtitle under the title', () => {
    render(<ScreenHeader title="Saved" subtitle="The ones that work for you" />);
    expect(styleOf('The ones that work for you').color).toBe(COLORS.light.textMuted);
  });

  it('omits the subtitle line entirely when there is none', () => {
    render(<ScreenHeader title="Settings" />);
    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.queryByText('The ones that work for you')).toBeNull();
  });

  it('marks the title as a heading for assistive tech', () => {
    render(<ScreenHeader title="Sleep" />);
    expect(screen.getByText('Sleep').props.role).toBe('heading');
  });

  it('puts the greeting above the title', () => {
    render(<ScreenHeader greeting="Good evening, Rhys" title="Let's settle things" />);
    expect(screen.getByText('Good evening, Rhys')).toBeTruthy();
    expect(styleOf("Let's settle things").marginTop).toBe(SPACE.s2);
  });

  it('leaves the title flush when there is no greeting', () => {
    render(<ScreenHeader title="How was today?" />);
    expect(styleOf('How was today?').marginTop).toBeUndefined();
  });

  it('renders a trailing action, the settings entry point', () => {
    // Settings is reached from this button, not from a fifth tab.
    render(<ScreenHeader title="Let's settle things" action={<RNText>Open settings</RNText>} />);
    expect(screen.getByText('Open settings')).toBeTruthy();
  });

  it('sits inside the screen gutter', () => {
    render(<ScreenHeader title="Saved" />);
    const header = StyleSheet.flatten(screen.getByTestId('screen-header').props.style);
    expect(header.paddingHorizontal).toBe(LAYOUT.screenGutter);
  });

  it('drops its bottom padding for a screen that brings its own', () => {
    // Two paddings stacked would double the gap under the title.
    render(<ScreenHeader title="Let's settle things" paddingBottom={0} />);
    expect(StyleSheet.flatten(screen.getByTestId('screen-header').props.style).paddingBottom).toBe(
      0
    );
  });

  it('takes the night text colour on the dark screens', () => {
    render(
      <ThemeProvider scheme="dark">
        <ScreenHeader title="Sleep" subtitle="Wind down for the night" />
      </ThemeProvider>
    );
    expect(styleOf('Sleep').color).toBe(COLORS.dark.text);
    expect(styleOf('Wind down for the night').color).toBe(COLORS.dark.textMuted);
  });
});

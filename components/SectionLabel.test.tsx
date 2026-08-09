import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SectionLabel } from './SectionLabel';
import { ThemeProvider } from '../theme/ThemeProvider';
import { COLORS, TYPE } from '../theme/tokens';

function styleOf(text: string) {
  return StyleSheet.flatten(screen.getByText(text).props.style);
}

describe('SectionLabel', () => {
  it('renders mono, tracked and uppercased', () => {
    // Callers pass ordinary copy — the casing is a type role, not a second version of
    // the string in the source.
    render(<SectionLabel>Playback</SectionLabel>);
    expect(styleOf('Playback')).toMatchObject(TYPE.sectionLabel);
  });

  it('defaults to the subtle tone the settings groups use', () => {
    render(<SectionLabel>Playback</SectionLabel>);
    expect(styleOf('Playback').color).toBe(COLORS.light.textSubtle);
  });

  it('takes the accent where the design asks for it', () => {
    render(<SectionLabel tone="primary">Continue</SectionLabel>);
    expect(styleOf('Continue').color).toBe(COLORS.light.primary);
  });

  it('steps up to 13px above the Sleep routine list', () => {
    render(<SectionLabel size="large">Tonight&apos;s routine</SectionLabel>);
    expect(styleOf("Tonight's routine")).toMatchObject(TYPE.sectionLabelLarge);
  });

  it('reads its colour from the night palette on the dark screens', () => {
    render(
      <ThemeProvider scheme="dark">
        <SectionLabel tone="primary">Tonight</SectionLabel>
      </ThemeProvider>
    );
    expect(styleOf('Tonight').color).toBe(COLORS.dark.primary);
  });
});

import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SavedStar } from './SavedStar';
import { ThemeProvider } from '../theme/ThemeProvider';
import { COLORS, LAYOUT, OVERLAY } from '../theme/tokens';

const onPress = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

function star() {
  return screen.getByRole('button');
}

describe('SavedStar', () => {
  it('fills the star when the sound is saved', () => {
    render(<SavedStar saved soundName="Underwater" onPress={onPress} />);
    expect(screen.getByText('★')).toBeTruthy();
  });

  it('hollows the star out when it is not', () => {
    render(<SavedStar saved={false} soundName="Underwater" onPress={onPress} />);
    expect(screen.getByText('☆')).toBeTruthy();
  });

  it('tints a saved star with the accent and an idle one with the grey', () => {
    render(<SavedStar saved soundName="Underwater" onPress={onPress} />);
    expect(StyleSheet.flatten(screen.getByText('★').props.style).color).toBe(OVERLAY.starSaved);

    screen.rerender(<SavedStar saved={false} soundName="Underwater" onPress={onPress} />);
    expect(StyleSheet.flatten(screen.getByText('☆').props.style).color).toBe(OVERLAY.starIdle);
  });

  it('names the sound in the label, since a star alone says nothing', () => {
    render(<SavedStar saved={false} soundName="Underwater" onPress={onPress} />);
    expect(star().props.accessibilityLabel).toBe('Save Underwater');

    screen.rerender(<SavedStar saved soundName="Underwater" onPress={onPress} />);
    expect(star().props.accessibilityLabel).toBe('Remove Underwater from saved');
  });

  it('reports the saved state to assistive tech', () => {
    render(<SavedStar saved soundName="Underwater" onPress={onPress} />);
    expect(star().props.accessibilityState).toMatchObject({ selected: true });
  });

  it('toggles when pressed', () => {
    render(<SavedStar saved={false} soundName="Underwater" onPress={onPress} />);
    fireEvent.press(star());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does nothing when disabled', () => {
    render(<SavedStar saved={false} soundName="Underwater" onPress={onPress} disabled />);
    fireEvent.press(star());
    expect(onPress).not.toHaveBeenCalled();
  });

  it('grows the 28pt chip to a 44pt hit area', () => {
    render(<SavedStar saved={false} soundName="Underwater" onPress={onPress} />);
    expect(star().props.hitSlop).toBe((LAYOUT.minTouchTarget - 28) / 2);
  });

  it('sits on a translucent chip rather than a shadow', () => {
    render(<SavedStar saved={false} soundName="Underwater" onPress={onPress} />);
    const style = StyleSheet.flatten(star().props.style) as Record<string, unknown>;
    expect(style.backgroundColor).toBe(OVERLAY.chip);
    expect(style.shadowOpacity).toBeUndefined();
  });
});

describe('SavedStar on a surface', () => {
  function renderBare(saved: boolean) {
    render(
      <ThemeProvider scheme="dark">
        <SavedStar saved={saved} soundName="Underwater" onPress={onPress} variant="bare" />
      </ThemeProvider>
    );
  }

  it('drops the chip, which would be a hole in a surface', () => {
    renderBare(false);
    const style = StyleSheet.flatten(star().props.style) as Record<string, unknown>;
    expect(style.backgroundColor).toBe('transparent');
  });

  it('takes its colours from the palette rather than the artwork overlay', () => {
    renderBare(true);
    expect(StyleSheet.flatten(screen.getByText('★').props.style).color).toBe(COLORS.dark.primary);

    screen.rerender(
      <ThemeProvider scheme="dark">
        <SavedStar saved={false} soundName="Underwater" onPress={onPress} variant="bare" />
      </ThemeProvider>
    );
    expect(StyleSheet.flatten(screen.getByText('☆').props.style).color).toBe(COLORS.dark.textMuted);
  });

  it('draws the glyph larger, with no chip to constrain it', () => {
    renderBare(false);
    expect(StyleSheet.flatten(screen.getByText('☆').props.style).fontSize).toBe(20);
  });

  it('keeps the 44pt hit area and the labels it has on artwork', () => {
    renderBare(false);
    expect(star().props.hitSlop).toBe((LAYOUT.minTouchTarget - 28) / 2);
    expect(star().props.accessibilityLabel).toBe('Save Underwater');
  });
});

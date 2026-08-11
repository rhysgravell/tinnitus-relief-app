import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { OutlineButton } from './OutlineButton';
import { ThemeProvider } from '../theme/ThemeProvider';
import { COLORS, RADIUS } from '../theme/tokens';

const onPress = jest.fn();

function renderButton(accessibilityLabel?: string) {
  render(
    <ThemeProvider scheme="dark">
      <OutlineButton label="Start" onPress={onPress} accessibilityLabel={accessibilityLabel} />
    </ThemeProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('OutlineButton', () => {
  it('shows its label', () => {
    renderButton();
    expect(screen.getByText('Start')).toBeTruthy();
  });

  it('fires when pressed', () => {
    renderButton();
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalled();
  });

  it('says what it starts, for a label that on its own says nothing', () => {
    renderButton('Start slow breathing');
    expect(screen.getByRole('button', { name: 'Start slow breathing' })).toBeTruthy();
  });

  it('makes no claim about being selected', () => {
    // It looks like a pill and is not one: a pill reports selection, and this is an action.
    renderButton();
    expect(screen.getByRole('button').props.accessibilityState?.selected).toBeUndefined();
  });

  it('is an outline on the surface, not a fill', () => {
    renderButton();
    const style = StyleSheet.flatten(screen.getByRole('button').props.style);
    expect(style.borderRadius).toBe(RADIUS.pill);
    expect(style.borderColor).toBe(COLORS.dark.borderStrong);
    expect(style.backgroundColor).toBeUndefined();
  });

  it('carries the accent on its label', () => {
    renderButton();
    expect(StyleSheet.flatten(screen.getByText('Start').props.style).color).toBe(
      COLORS.dark.primary
    );
  });
});

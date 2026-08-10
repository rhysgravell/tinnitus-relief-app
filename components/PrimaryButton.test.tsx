import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { ThemeProvider } from '../theme/ThemeProvider';
import { COLORS, RADIUS, TYPE } from '../theme/tokens';

function buttonStyle() {
  return StyleSheet.flatten(screen.getByRole('button').props.style);
}

describe('PrimaryButton', () => {
  it('renders its label', () => {
    render(<PrimaryButton label="Save today" onPress={() => {}} />);
    expect(screen.getByText('Save today')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<PrimaryButton label="Continue" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('fills the width with the primary green and the card radius', () => {
    render(<PrimaryButton label="Continue" onPress={() => {}} />);
    expect(buttonStyle()).toMatchObject({
      alignSelf: 'stretch',
      backgroundColor: COLORS.light.primary,
      borderRadius: RADIUS.card,
    });
  });

  it('labels itself in the button type role', () => {
    render(<PrimaryButton label="Continue" onPress={() => {}} />);
    expect(StyleSheet.flatten(screen.getByText('Continue').props.style)).toMatchObject(
      TYPE.buttonLabel
    );
  });

  it('shrinks to its label when inline', () => {
    // The Saved empty state centres the button under the copy rather than stretching it.
    render(<PrimaryButton label="Browse sounds" onPress={() => {}} inline />);
    expect(buttonStyle()).toMatchObject({ alignSelf: 'center' });
  });

  it('does not fire when disabled', () => {
    const onPress = jest.fn();
    render(<PrimaryButton label="Save today" onPress={onPress} disabled />);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('reports being disabled to assistive tech', () => {
    render(<PrimaryButton label="Save today" onPress={() => {}} disabled />);
    expect(screen.getByRole('button').props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('takes the night accent on a dark surface', () => {
    render(
      <ThemeProvider scheme="dark">
        <PrimaryButton label="Start now" onPress={() => {}} />
      </ThemeProvider>
    );
    expect(buttonStyle().backgroundColor).toBe(COLORS.dark.primary);
  });
});

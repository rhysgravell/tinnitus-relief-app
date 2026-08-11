import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SecondaryButton } from './SecondaryButton';
import { ThemeProvider } from '../theme/ThemeProvider';
import { COLORS, RADIUS, TYPE } from '../theme/tokens';

const onPress = jest.fn();

function renderButton(props: Partial<Parameters<typeof SecondaryButton>[0]> = {}) {
  render(
    <ThemeProvider scheme="dark">
      <SecondaryButton label="Start now" onPress={onPress} {...props} />
    </ThemeProvider>
  );
}

function button() {
  return screen.getByRole('button');
}

function buttonStyle() {
  return StyleSheet.flatten(button().props.style);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SecondaryButton', () => {
  it('shows its label in the button role', () => {
    renderButton();
    expect(screen.getByText('Start now')).toBeTruthy();
  });

  it('fires when pressed', () => {
    renderButton();
    fireEvent.press(button());
    expect(onPress).toHaveBeenCalled();
  });

  it('sits on the tinted surface rather than the accent', () => {
    // The accent belongs to the one primary action on a screen; this is not it.
    renderButton();
    expect(buttonStyle().backgroundColor).toBe(COLORS.dark.surfaceAlt);
  });

  it('takes the secondary radius from the tokens', () => {
    renderButton();
    expect(buttonStyle().borderRadius).toBe(RADIUS.secondaryButton);
  });

  it('stretches to the width it is given', () => {
    renderButton();
    expect(buttonStyle().alignSelf).toBe('stretch');
  });

  it('labels itself with the button type role', () => {
    renderButton();
    expect(StyleSheet.flatten(screen.getByText('Start now').props.style)).toMatchObject(
      TYPE.buttonLabel
    );
  });

  it('does not fire when disabled', () => {
    renderButton({ disabled: true });
    fireEvent.press(button());
    expect(onPress).not.toHaveBeenCalled();
    expect(button().props.accessibilityState).toMatchObject({ disabled: true });
  });
});

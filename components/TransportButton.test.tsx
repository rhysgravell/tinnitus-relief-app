import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { TransportButton } from './TransportButton';
import { ThemeProvider } from '../theme/ThemeProvider';
import { COLORS, LAYOUT } from '../theme/tokens';

const onPress = jest.fn();

function renderButton(playing: boolean, disabled = false) {
  render(
    <ThemeProvider scheme="dark">
      <TransportButton playing={playing} onPress={onPress} disabled={disabled} />
    </ThemeProvider>
  );
  return screen.getByTestId('transport-button');
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TransportButton', () => {
  it('shows a triangle when paused and bars when playing', () => {
    renderButton(false);
    expect(screen.getByTestId('play-triangle')).toBeTruthy();

    screen.rerender(
      <ThemeProvider scheme="dark">
        <TransportButton playing onPress={onPress} />
      </ThemeProvider>
    );
    expect(screen.queryByTestId('play-triangle')).toBeNull();
  });

  it('names the action it will take rather than the state it is in', () => {
    expect(renderButton(true).props.accessibilityLabel).toBe('Pause');
    expect(renderButton(false).props.accessibilityLabel).toBe('Play');
  });

  it('inverts against the screen so it is the obvious thing to press', () => {
    const style = StyleSheet.flatten(renderButton(true).props.style) as Record<string, unknown>;
    expect(style.backgroundColor).toBe(COLORS.dark.text);
  });

  it('clears the minimum touch target on its own, with room to spare', () => {
    const style = StyleSheet.flatten(renderButton(true).props.style) as Record<string, number>;
    expect(style.width).toBeGreaterThanOrEqual(LAYOUT.minTouchTarget);
    expect(style.borderRadius).toBe(style.width / 2);
  });

  it('separates itself with a fill rather than a shadow', () => {
    const style = StyleSheet.flatten(renderButton(true).props.style) as Record<string, unknown>;
    expect(style.shadowOpacity).toBeUndefined();
    expect(style.elevation).toBeUndefined();
  });

  it('toggles when pressed', () => {
    fireEvent.press(renderButton(true));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does nothing when there is no recording to play', () => {
    fireEvent.press(renderButton(false, true));
    expect(onPress).not.toHaveBeenCalled();
  });
});

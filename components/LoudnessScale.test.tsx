import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { LoudnessScale } from './LoudnessScale';
import { ThemeProvider } from '../theme/ThemeProvider';
import { COLORS, LOUDNESS_HEIGHTS } from '../theme/tokens';
import type { Loudness } from '../store/checkIns';

const onChange = jest.fn();

function renderScale(value: Loudness | null = null) {
  render(
    <ThemeProvider scheme="light">
      <LoudnessScale value={value} onChange={onChange} />
    </ThemeProvider>
  );
}

function barStyle(level: Loudness) {
  return StyleSheet.flatten(screen.getByTestId(`loudness-bar-${level}`).props.style);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LoudnessScale', () => {
  it('offers five levels', () => {
    renderScale();
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('names both ends of the scale, and only the ends', () => {
    // Naming all five would ask the user to accept a word for their own tinnitus.
    renderScale();
    expect(screen.getByText('Barely there')).toBeTruthy();
    expect(screen.getByText('Overwhelming')).toBeTruthy();
  });

  it('rises from left to right', () => {
    renderScale();
    const heights = [1, 2, 3, 4, 5].map((level) => barStyle(level as Loudness).height);
    expect(heights).toEqual(LOUDNESS_HEIGHTS.map((percent) => `${percent}%`));
  });

  it('reports the picked level and nothing else as selected', () => {
    renderScale(3);
    const states = screen.getAllByRole('button').map((bar) => bar.props.accessibilityState);
    expect(states.map((state) => state.selected)).toEqual([false, false, true, false, false]);
  });

  it('fills the picked bar with the accent and leaves the rest idle', () => {
    renderScale(3);
    expect(barStyle(3).backgroundColor).toBe(COLORS.light.primary);
    expect(barStyle(4).backgroundColor).toBe(COLORS.light.barIdle);
  });

  it('picks nothing until the user does', () => {
    renderScale();
    for (const level of [1, 2, 3, 4, 5] as Loudness[]) {
      expect(barStyle(level).backgroundColor).toBe(COLORS.light.barIdle);
    }
  });

  it('reports the level that was tapped', () => {
    renderScale();
    fireEvent.press(screen.getByLabelText('Level 4 of 5'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('gives the short bars a target the full height of the row', () => {
    // Level 1 draws 13pt tall. Tapping only the ink would put it under the 44pt minimum.
    renderScale();
    const column = StyleSheet.flatten(screen.getByLabelText('Level 1 of 5').props.style);
    expect(column.height).toBe('100%');
    expect(column.justifyContent).toBe('flex-end');
  });
});

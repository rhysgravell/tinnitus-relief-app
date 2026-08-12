import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { MoodChips } from './MoodChips';
import { ThemeProvider } from '../theme/ThemeProvider';
import { MOOD_OPTIONS } from '../store/checkIns';
import type { Mood } from '../store/checkIns';

const onChange = jest.fn();

function renderChips(value: Mood | null = null) {
  render(
    <ThemeProvider scheme="light">
      <MoodChips value={value} onChange={onChange} />
    </ThemeProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MoodChips', () => {
  it('offers every mood as a word', () => {
    renderChips();
    for (const { label } of MOOD_OPTIONS) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it('marks one as selected at a time', () => {
    renderChips('tired');
    const selected = screen
      .getAllByRole('button')
      .filter((chip) => chip.props.accessibilityState?.selected);
    expect(selected).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Tired' }).props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it('reports the mood that was tapped', () => {
    renderChips();
    fireEvent.press(screen.getByRole('button', { name: 'Anxious' }));
    expect(onChange).toHaveBeenCalledWith('anxious');
  });

  it('wraps onto a second line rather than scrolling sideways', () => {
    // Six words do not fit one row, and a hidden chip is a mood nobody picks.
    renderChips();
    expect(StyleSheet.flatten(screen.getByTestId('mood-chips').props.style).flexWrap).toBe('wrap');
  });
});

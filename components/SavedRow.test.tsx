import { fireEvent, render, screen } from '@testing-library/react-native';
import { SavedRow } from './SavedRow';
import { ThemeProvider } from '../theme/ThemeProvider';
import { findSound } from '../store/sounds';

const onPress = jest.fn();

function sound(id: string) {
  const found = findSound(id);
  if (!found) throw new Error(`${id} is not in the catalogue`);
  return found;
}

function renderRow(id = 'evening-forest', meta = '14 sessions · 30m') {
  render(
    <ThemeProvider scheme="light">
      <SavedRow sound={sound(id)} meta={meta} onPress={onPress} />
    </ThemeProvider>
  );
}

function row(id: string) {
  return screen.getByTestId(`saved-row-${id}`);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SavedRow', () => {
  it('names the sound and how it has been used', () => {
    renderRow();
    expect(screen.getByText('Evening Forest')).toBeTruthy();
    expect(screen.getByText('14 sessions · 30m')).toBeTruthy();
  });

  it('opens on a tap anywhere in the row, not only on the circle', () => {
    renderRow();
    fireEvent.press(row('evening-forest'));
    expect(onPress).toHaveBeenCalled();
  });

  it('offers the row to assistive tech by name, with the context as a hint', () => {
    renderRow();
    expect(row('evening-forest').props.accessibilityLabel).toBe('Evening Forest');
    expect(row('evening-forest').props.accessibilityHint).toBe('14 sessions · 30m');
  });

  it('shows what pressing it does', () => {
    renderRow();
    expect(screen.getByTestId('play-triangle')).toBeTruthy();
  });

  it('keeps a saved sound with no recording in the list but inert', () => {
    // It is saved, and dropping it would look like the star had been lost.
    renderRow('rain-on-canvas', 'Coming soon');
    expect(screen.getByText('Rain on canvas')).toBeTruthy();
    expect(row('rain-on-canvas').props.accessibilityState).toMatchObject({ disabled: true });

    fireEvent.press(row('rain-on-canvas'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('truncates a long name rather than pushing the circle off the row', () => {
    renderRow();
    expect(screen.getByText('Evening Forest').props.numberOfLines).toBe(1);
  });
});

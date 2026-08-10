import { fireEvent, render, screen } from '@testing-library/react-native';
import { EmptyState } from './EmptyState';
import { ThemeProvider } from '../theme/ThemeProvider';

const onPress = jest.fn();

type Action = { label: string; onPress: () => void };

function renderState(action?: Action) {
  render(
    <ThemeProvider scheme="light">
      <EmptyState
        glyph="☆"
        title="Nothing saved yet"
        body="Tap the star on any sound."
        action={action}
      />
    </ThemeProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('EmptyState', () => {
  it('says what is missing and how to change it', () => {
    renderState();
    expect(screen.getByText('Nothing saved yet')).toBeTruthy();
    expect(screen.getByText('Tap the star on any sound.')).toBeTruthy();
  });

  it('shows the glyph it was given rather than an icon', () => {
    renderState();
    expect(screen.getByText('☆')).toBeTruthy();
  });

  it('offers a way out when there is one', () => {
    renderState({ label: 'Browse sounds', onPress });
    fireEvent.press(screen.getByRole('button', { name: 'Browse sounds' }));
    expect(onPress).toHaveBeenCalled();
  });

  it('leaves the button out when there is nowhere to go', () => {
    renderState();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

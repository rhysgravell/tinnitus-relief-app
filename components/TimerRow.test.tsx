import { fireEvent, render, screen } from '@testing-library/react-native';
import { TimerRow } from './TimerRow';
import { ThemeProvider } from '../theme/ThemeProvider';

const onChange = jest.fn();

function renderRow(value: number | null = 45) {
  render(
    <ThemeProvider scheme="dark">
      <TimerRow value={value} onChange={onChange} />
    </ThemeProvider>
  );
}

function pill(name: string) {
  return screen.getByRole('button', { name });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TimerRow', () => {
  it('offers every length in one tap, none behind a sheet', () => {
    renderRow();
    for (const label of ['15m', '30m', '45m', '60m', '∞']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it('spells the lengths out for assistive tech rather than leaving them as glyphs', () => {
    renderRow();
    expect(pill('45 minutes')).toBeTruthy();
    expect(pill('No timer')).toBeTruthy();
  });

  it('fills the selected length and leaves the rest outlined', () => {
    renderRow(30);
    expect(pill('30 minutes').props.accessibilityState).toMatchObject({ selected: true });
    expect(pill('45 minutes').props.accessibilityState).toMatchObject({ selected: false });
  });

  it('reports the chosen length in minutes', () => {
    renderRow();
    fireEvent.press(pill('15 minutes'));
    expect(onChange).toHaveBeenCalledWith(15);
  });

  it('reports the infinite option as no timer at all', () => {
    // Null rather than a sentinel number, so nothing downstream has to know that, say,
    // 0 or -1 means "keep going".
    renderRow();
    fireEvent.press(pill('No timer'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('shows the infinite option as selected when there is no timer', () => {
    renderRow(null);
    expect(pill('No timer').props.accessibilityState).toMatchObject({ selected: true });
  });
});

import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { TimeChoices } from './TimeChoices';
import { ThemeProvider } from '../theme/ThemeProvider';
import { REMINDER_TIMES } from '../store/settings';
import { formatTimeOfDay } from '../utils/time';

const onChange = jest.fn();

function renderChoices(props: Partial<Parameters<typeof TimeChoices>[0]> = {}) {
  render(
    <ThemeProvider scheme="light">
      <TimeChoices testID="choices" value={null} onChange={onChange} {...props} />
    </ThemeProvider>
  );
}

/** A pill by the label it shows, or by the name it is read out under. */
function pill(name: string) {
  return screen.getByRole('button', { name });
}

beforeEach(() => {
  onChange.mockClear();
});

describe('TimeChoices', () => {
  it('offers every time the app schedules reminders at', () => {
    renderChoices();
    for (const at of REMINDER_TIMES) {
      expect(screen.getByText(formatTimeOfDay(at))).toBeTruthy();
    }
  });

  it('offers "Off" as one of the choices', () => {
    // A reminder needs the OS's permission, so it starts off; a control that could only set
    // a time would leave no way back.
    renderChoices();
    expect(pill('Off')).toBeTruthy();
  });

  it('marks "Off" as the choice when there is no reminder', () => {
    renderChoices({ value: null });
    expect(pill('Off').props.accessibilityState).toMatchObject({ selected: true });
  });

  it('marks the chosen time', () => {
    renderChoices({ value: { hour: 21, minute: 30 } });

    expect(pill('9:30 pm').props.accessibilityState).toMatchObject({ selected: true });
    expect(pill('Off').props.accessibilityState).toMatchObject({ selected: false });
  });

  it('reports the time that was picked', () => {
    renderChoices({ value: null });
    fireEvent.press(pill('10:30 pm'));

    expect(onChange).toHaveBeenCalledWith({ hour: 22, minute: 30 });
  });

  it('reports null for "Off" rather than a time nothing will fire at', () => {
    renderChoices({ value: { hour: 21, minute: 0 } });
    fireEvent.press(pill('Off'));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('reads the 24 hour clock out the way it is spoken', () => {
    // The design writes "22:30"; assistive tech would otherwise read out two numbers.
    renderChoices();
    expect(screen.getByText('22:30')).toBeTruthy();
    expect(pill('10:30 pm')).toBeTruthy();
  });

  it('wraps rather than scrolling sideways', () => {
    // Eleven options do not fit a phone's width, and a row that scrolled would hide some
    // of them behind a gesture.
    renderChoices();
    const style = StyleSheet.flatten(screen.getByTestId('choices').props.style);
    expect(style.flexWrap).toBe('wrap');
  });
});

import { fireEvent, render, screen } from '@testing-library/react-native';
import { TonightCard } from './TonightCard';
import { ThemeProvider } from '../theme/ThemeProvider';

const onReminderChange = jest.fn();
const onStart = jest.fn();

function renderCard(props: Partial<Parameters<typeof TonightCard>[0]> = {}) {
  render(
    <ThemeProvider scheme="dark">
      <TonightCard
        time="22:30"
        summary="45 min · Underwater"
        reminderOn={false}
        onReminderChange={onReminderChange}
        onStart={onStart}
        {...props}
      />
    </ThemeProvider>
  );
}

function reminder() {
  return screen.getByRole('switch');
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TonightCard', () => {
  it('says when the wind-down is and what it will play', () => {
    renderCard();
    expect(screen.getByText('Wind-down at 22:30')).toBeTruthy();
    expect(screen.getByText('45 min · Underwater')).toBeTruthy();
  });

  it('heads itself with the label the design gives it', () => {
    renderCard();
    expect(screen.getByText('Tonight')).toBeTruthy();
  });

  it('names the time in the switch, which has no visible label of its own', () => {
    renderCard();
    expect(reminder().props.accessibilityLabel).toBe('Remind me at 22:30');
  });

  it('reports the reminder as off until it is on', () => {
    renderCard();
    expect(reminder().props.accessibilityState).toMatchObject({ checked: false });

    fireEvent(reminder(), 'valueChange', true);
    expect(onReminderChange).toHaveBeenCalledWith(true);
  });

  it('turns the reminder back off', () => {
    renderCard({ reminderOn: true });
    expect(reminder().props.accessibilityState).toMatchObject({ checked: true });

    fireEvent(reminder(), 'valueChange', false);
    expect(onReminderChange).toHaveBeenCalledWith(false);
  });

  it('starts tonight now, separately from the reminder', () => {
    // Wanting a nudge at 22:30 and wanting to start this second are different things.
    renderCard();
    fireEvent.press(screen.getByRole('button', { name: 'Start now' }));

    expect(onStart).toHaveBeenCalled();
    expect(onReminderChange).not.toHaveBeenCalled();
  });

  it('says so when notifications are switched off for the app', () => {
    // A switch with nothing behind it would look broken rather than blocked.
    renderCard({ denied: true });
    expect(screen.getByText(/Notifications are off for this app/)).toBeTruthy();
    expect(screen.queryByText('45 min · Underwater')).toBeNull();
  });
});

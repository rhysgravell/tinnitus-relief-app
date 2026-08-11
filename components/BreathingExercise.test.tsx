import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BreathingExercise } from './BreathingExercise';
import { BREATHING_MINUTES } from '../store/routine';

const onClose = jest.fn();

/** The interval the clock refreshes on. */
const TICK = 1000;

/**
 * Moves time on by `ms`.
 *
 * The clock reads elapsed time off `Date.now()` rather than counting ticks, so this jumps
 * the system clock and fires a single tick rather than one per second.
 */
function advance(ms: number) {
  act(() => {
    jest.setSystemTime(Date.now() + ms - TICK);
    jest.advanceTimersByTime(TICK);
  });
}

function renderExercise(visible = true) {
  return render(<BreathingExercise visible={visible} onClose={onClose} />);
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('BreathingExercise', () => {
  it('opens on the in-breath with the full count', () => {
    renderExercise();
    expect(screen.getByText('Breathe in')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
  });

  it('says what to do with the sound that is already playing', () => {
    renderExercise();
    expect(screen.getByText(/Your sound keeps playing underneath/)).toBeTruthy();
  });

  it('counts the phase down and moves on to the next', () => {
    renderExercise();
    advance(2 * TICK);
    expect(screen.getByText('2')).toBeTruthy();

    advance(2 * TICK);
    expect(screen.getByText('Hold')).toBeTruthy();
  });

  it('reaches the long out-breath', () => {
    renderExercise();
    advance(8 * TICK);
    expect(screen.getByText('Breathe out')).toBeTruthy();
    expect(screen.getByText('6')).toBeTruthy();
  });

  it('starts the pattern again after a full cycle', () => {
    renderExercise();
    advance(16 * TICK);
    expect(screen.getByText('Breathe in')).toBeTruthy();
  });

  it('counts the four minutes down', () => {
    renderExercise();
    expect(screen.getByText('4:00')).toBeTruthy();

    advance(90 * TICK);
    expect(screen.getByText('2:30')).toBeTruthy();
  });

  it('stops itself at the end rather than looping forever', () => {
    renderExercise();
    advance(BREATHING_MINUTES * 60 * TICK);

    expect(screen.getByText("That's four minutes")).toBeTruthy();
    expect(screen.getByText('0:00')).toBeTruthy();
  });

  it('holds the clock once it has finished', () => {
    renderExercise();
    advance(BREATHING_MINUTES * 60 * TICK);
    advance(60 * TICK);
    expect(screen.getByText('0:00')).toBeTruthy();
  });

  it('offers a way out at any point', () => {
    renderExercise();
    fireEvent.press(screen.getByRole('button', { name: 'Stop' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls the way out Done once the time is up', () => {
    // "Stop" would suggest there is still something running to stop.
    renderExercise();
    advance(BREATHING_MINUTES * 60 * TICK);
    fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders nothing while closed', () => {
    renderExercise(false);
    expect(screen.queryByText('Breathe in')).toBeNull();
  });

  it('starts from the beginning each time it opens', () => {
    // Rather than carrying on from where the last run was abandoned.
    const { rerender } = renderExercise();
    advance(10 * TICK);
    expect(screen.getByText('Breathe out')).toBeTruthy();

    rerender(<BreathingExercise visible={false} onClose={onClose} />);
    rerender(<BreathingExercise visible={true} onClose={onClose} />);

    expect(screen.getByText('Breathe in')).toBeTruthy();
    expect(screen.getByText('4:00')).toBeTruthy();
  });
});

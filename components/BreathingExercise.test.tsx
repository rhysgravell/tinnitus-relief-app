import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { BreathingExercise } from './BreathingExercise';
import { BREATHING_MINUTES } from '../store/routine';
import { BREATHING_PHASES, CYCLE_SECONDS } from '../utils/breathing';

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

function renderExercise(visible = true, soundPlaying = true) {
  return render(
    <BreathingExercise visible={visible} onClose={onClose} soundPlaying={soundPlaying} />
  );
}

/** Everything said to a screen reader since the exercise opened, in order. */
function announced(): string[] {
  return jest.mocked(AccessibilityInfo.announceForAccessibility).mock.calls.map(([said]) => said);
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  // The spy above is laid on a shared module, so it comes off between tests rather than
  // being wrapped again by the next one.
  jest.restoreAllMocks();
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

  it('does not promise a sound when there is none', () => {
    // The routine can be run without ever opening one, and the promise is the routine's,
    // not something this sheet can make on its own.
    renderExercise(true, false);
    expect(screen.queryByText(/Your sound keeps playing underneath/)).toBeNull();
    expect(screen.getByText(/breathe at the pace it sets/)).toBeTruthy();
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

  it('reads the countdown out as a span, the same as the session does', () => {
    renderExercise();
    expect(screen.getByLabelText('4 minutes left')).toBeTruthy();

    advance(90 * TICK);
    expect(screen.getByLabelText('2 minutes, 30 seconds left')).toBeTruthy();
  });

  it('speaks the first instruction as it opens', () => {
    // The circle says when to breathe by moving, which is nothing to a screen reader. The
    // length comes with the phase because the count inside the circle is a digit.
    renderExercise();
    expect(announced()).toEqual(['Breathe in for 4 seconds']);
  });

  it('says nothing new while a phase is still running', () => {
    // Every second redraws the count, and an instruction repeated four times over would
    // talk straight through the breath it was asking for.
    renderExercise();
    advance(3 * TICK);

    expect(screen.getByText('1')).toBeTruthy();
    expect(announced()).toEqual(['Breathe in for 4 seconds']);
  });

  it('speaks every phase in the pattern as it begins, whatever the pattern is', () => {
    // Derived from the phases rather than listed, so a pattern that gained a phase is
    // still spoken in full. The seconds are written out rather than run back through the
    // formatter, so this says what is actually heard.
    renderExercise();
    // A second at a time, not one leap: `advance` jumps the clock and fires a single tick,
    // which would land past three of the four phases without ever drawing them.
    for (let second = 1; second < CYCLE_SECONDS; second += 1) advance(TICK);

    expect(announced()).toEqual(
      BREATHING_PHASES.map(({ label, seconds }) => `${label} for ${seconds} seconds`)
    );
  });

  it('says when the four minutes are up', () => {
    // The circle stops moving and the count empties — neither of which is announced, so
    // the end of the exercise would otherwise just be a silence that never broke.
    renderExercise();
    advance(BREATHING_MINUTES * 60 * TICK);

    expect(announced().at(-1)).toBe("That's four minutes");
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

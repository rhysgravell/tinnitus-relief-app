import { fireEvent, render, screen } from '@testing-library/react-native';
import { BreathingExercise } from './BreathingExercise';

describe('BreathingExercise', () => {
  it('shows the current phase and countdown when visible', () => {
    render(<BreathingExercise visible={true} onClose={jest.fn()} />);
    expect(screen.getByText('Breathe in')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
  });

  it('calls onClose when Done is tapped', () => {
    const onClose = jest.fn();
    render(<BreathingExercise visible={true} onClose={onClose} />);
    fireEvent.press(screen.getByText('Done'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

import { fireEvent, render, screen } from '@testing-library/react-native';
import { SleepTipCard } from './SleepTipCard';

const tip = {
  id: 'dim-the-lights',
  icon: '🕯️',
  title: 'Dim the lights early',
  description: 'Lowering light an hour before bed helps your body ease into sleep mode.',
};

describe('SleepTipCard', () => {
  it('renders the icon, title, and description', () => {
    render(<SleepTipCard tip={tip} />);
    expect(screen.getByText('🕯️')).toBeTruthy();
    expect(screen.getByText('Dim the lights early')).toBeTruthy();
    expect(screen.getByText('Lowering light an hour before bed helps your body ease into sleep mode.')).toBeTruthy();
  });

  it('does not show a chevron when there is no onPress', () => {
    render(<SleepTipCard tip={tip} />);
    expect(screen.queryByText('›')).toBeNull();
  });

  it('calls onPress and shows a chevron when interactive', () => {
    const onPress = jest.fn();
    render(<SleepTipCard tip={tip} onPress={onPress} />);
    expect(screen.getByText('›')).toBeTruthy();
    fireEvent.press(screen.getByText('Dim the lights early'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

import { render, screen } from '@testing-library/react-native';
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
});

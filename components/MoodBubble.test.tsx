import { fireEvent, render, screen } from '@testing-library/react-native';
import { MoodBubble } from './MoodBubble';

const mood = { id: 'happy', emoji: '😊', label: 'Happy' };

describe('MoodBubble', () => {
  it('renders the emoji and label', () => {
    render(<MoodBubble mood={mood} size={150} tone="a" isSelected={false} onPress={jest.fn()} />);
    expect(screen.getByText('😊')).toBeTruthy();
    expect(screen.getByText('Happy')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<MoodBubble mood={mood} size={150} tone="a" isSelected={false} onPress={onPress} />);
    fireEvent.press(screen.getByText('Happy'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

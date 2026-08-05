import { fireEvent, render, screen } from '@testing-library/react-native';
import { SoundscapeBubble } from './SoundscapeBubble';

const soundscape = {
  id: 'rain',
  title: 'Gentle Rain',
  description: 'Soft rainfall to ease the ringing',
  file: 1,
};

describe('SoundscapeBubble', () => {
  it('renders the title', () => {
    render(
      <SoundscapeBubble
        soundscape={soundscape}
        size={150}
        tone="a"
        isPlaying={false}
        isLoading={false}
        isFavourite={false}
        hasError={false}
        onPress={jest.fn()}
        onFavouritePress={jest.fn()}
      />
    );
    expect(screen.getByText('Gentle Rain')).toBeTruthy();
  });

  it('shows an error message instead of the title when hasError is true', () => {
    render(
      <SoundscapeBubble
        soundscape={soundscape}
        size={150}
        tone="a"
        isPlaying={false}
        isLoading={false}
        isFavourite={false}
        hasError={true}
        onPress={jest.fn()}
        onFavouritePress={jest.fn()}
      />
    );
    expect(screen.getByText('Failed to load')).toBeTruthy();
    expect(screen.queryByText('Gentle Rain')).toBeNull();
  });

  it('hides the title while loading', () => {
    render(
      <SoundscapeBubble
        soundscape={soundscape}
        size={150}
        tone="a"
        isPlaying={false}
        isLoading={true}
        isFavourite={false}
        hasError={false}
        onPress={jest.fn()}
        onFavouritePress={jest.fn()}
      />
    );
    expect(screen.queryByText('Gentle Rain')).toBeNull();
  });

  it('calls onPress when the circle is tapped', () => {
    const onPress = jest.fn();
    render(
      <SoundscapeBubble
        soundscape={soundscape}
        size={150}
        tone="a"
        isPlaying={false}
        isLoading={false}
        isFavourite={false}
        hasError={false}
        onPress={onPress}
        onFavouritePress={jest.fn()}
      />
    );
    fireEvent.press(screen.getByText('Gentle Rain'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onFavouritePress when the star badge is tapped', () => {
    const onFavouritePress = jest.fn();
    render(
      <SoundscapeBubble
        soundscape={soundscape}
        size={150}
        tone="a"
        isPlaying={false}
        isLoading={false}
        isFavourite={false}
        hasError={false}
        onPress={jest.fn()}
        onFavouritePress={onFavouritePress}
      />
    );
    fireEvent.press(screen.getByText('☆'));
    expect(onFavouritePress).toHaveBeenCalledTimes(1);
  });
});

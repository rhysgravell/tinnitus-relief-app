import { fireEvent, render, screen } from '@testing-library/react-native';
import { SoundscapeCard } from './SoundscapeCard';

const soundscape = {
  id: 'rain',
  title: 'Gentle Rain',
  description: 'Soft rainfall to ease the ringing',
  file: 1,
};

describe('SoundscapeCard', () => {
  it('renders the title and description', () => {
    render(
      <SoundscapeCard
        soundscape={soundscape}
        isPlaying={false}
        isLoading={false}
        isFavourite={false}
        hasError={false}
        onPress={jest.fn()}
        onFavouritePress={jest.fn()}
      />
    );
    expect(screen.getByText('Gentle Rain')).toBeTruthy();
    expect(screen.getByText('Soft rainfall to ease the ringing')).toBeTruthy();
  });

  it('shows the error message instead of the description when hasError is true', () => {
    render(
      <SoundscapeCard
        soundscape={soundscape}
        isPlaying={false}
        isLoading={false}
        isFavourite={false}
        hasError={true}
        onPress={jest.fn()}
        onFavouritePress={jest.fn()}
      />
    );
    expect(screen.getByText('Failed to load audio')).toBeTruthy();
    expect(screen.queryByText('Soft rainfall to ease the ringing')).toBeNull();
  });

  it('shows a filled star when favourited and an empty one otherwise', () => {
    const { rerender } = render(
      <SoundscapeCard
        soundscape={soundscape}
        isPlaying={false}
        isLoading={false}
        isFavourite={false}
        hasError={false}
        onPress={jest.fn()}
        onFavouritePress={jest.fn()}
      />
    );
    expect(screen.getByText('☆')).toBeTruthy();

    rerender(
      <SoundscapeCard
        soundscape={soundscape}
        isPlaying={false}
        isLoading={false}
        isFavourite={true}
        hasError={false}
        onPress={jest.fn()}
        onFavouritePress={jest.fn()}
      />
    );
    expect(screen.getByText('★')).toBeTruthy();
  });

  it('calls onPress when the card body is tapped', () => {
    const onPress = jest.fn();
    render(
      <SoundscapeCard
        soundscape={soundscape}
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

  it('calls onFavouritePress when the star is tapped', () => {
    const onFavouritePress = jest.fn();
    render(
      <SoundscapeCard
        soundscape={soundscape}
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

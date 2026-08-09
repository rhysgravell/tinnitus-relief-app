import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SoundCard } from './SoundCard';
import { findSound } from '../store/sounds';
import type { Sound } from '../store/sounds';

const onPress = jest.fn();
const onToggleSaved = jest.fn();

/** Real catalogue entries, so the unplayable case is the one that actually ships. */
const playable = findSound('underwater') as Sound;
const unplayable = findSound('rain-on-canvas') as Sound;

function renderCard(sound: Sound, saved = false) {
  return render(
    <SoundCard sound={sound} saved={saved} onPress={onPress} onToggleSaved={onToggleSaved} />
  );
}

/**
 * The card and its star are both buttons, and the star's accessible name contains the
 * card's, so they are addressed by id rather than by role and name.
 */
function card(sound: Sound) {
  return screen.getByTestId(`sound-card-${sound.id}`);
}

function star(sound: Sound) {
  return screen.getByTestId(`saved-star-${sound.id}`);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SoundCard', () => {
  it('shows the name and the sonic descriptor', () => {
    renderCard(playable);
    expect(screen.getByText('Underwater')).toBeTruthy();
    expect(screen.getByText('Low-pass · deep')).toBeTruthy();
  });

  it('opens the sound when pressed', () => {
    renderCard(playable);
    fireEvent.press(card(playable));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('toggles saved without opening the sound', () => {
    renderCard(playable);
    fireEvent.press(star(playable));
    expect(onToggleSaved).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows the star already filled for a saved sound', () => {
    renderCard(playable, true);
    expect(star(playable).props.accessibilityLabel).toBe('Remove Underwater from saved');
  });

  it('names the card for assistive tech', () => {
    renderCard(playable);
    expect(card(playable).props.accessibilityRole).toBe('button');
    expect(card(playable).props.accessibilityLabel).toBe('Underwater');
  });

  it('lifts the star above the artwork rather than beside it', () => {
    renderCard(playable);
    expect(
      StyleSheet.flatten(screen.getByTestId(`saved-star-slot-${playable.id}`).props.style)
    ).toMatchObject({ position: 'absolute', zIndex: 2 });
  });

  it('says so rather than lying about a sound with no recording', () => {
    // `rain-on-canvas` ships with artwork but no audio file.
    renderCard(unplayable);
    expect(screen.getByText('Coming soon')).toBeTruthy();
    expect(screen.queryByText(unplayable.descriptor)).toBeNull();
  });

  it('does not open a sound that cannot play', () => {
    renderCard(unplayable);
    fireEvent.press(card(unplayable));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('dims an unavailable card and disables its star', () => {
    renderCard(unplayable);
    expect(StyleSheet.flatten(card(unplayable).props.style).opacity).toBe(0.5);
    fireEvent.press(star(unplayable));
    expect(onToggleSaved).not.toHaveBeenCalled();
  });

  it('keeps a long name on one line rather than growing the card', () => {
    renderCard(playable);
    expect(screen.getByText('Underwater').props.numberOfLines).toBe(1);
  });
});

import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ResumeCard } from './ResumeCard';
import { COLORS, RADIUS } from '../theme/tokens';
import { findSound } from '../store/sounds';
import type { Sound } from '../store/sounds';
import type { Session } from '../store/sessions';

const sound = findSound('underwater') as Sound;
const onPress = jest.fn();

const NOW = new Date('2026-08-09T20:00:00');

const session: Session = {
  soundId: sound.id,
  endedAt: '2026-08-08T22:30:00',
  durationMinutes: 42,
  timerMinutes: 45,
};

function renderCard(overrides: Partial<Session> = {}) {
  return render(
    <ResumeCard
      sound={sound}
      session={{ ...session, ...overrides }}
      onPress={onPress}
      now={NOW}
    />
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ResumeCard', () => {
  it('labels itself Continue', () => {
    renderCard();
    // The type role uppercases it, so the source keeps ordinary copy.
    expect(screen.getByText('Continue')).toBeTruthy();
  });

  it('names the sound it would resume', () => {
    renderCard();
    expect(screen.getByText('Underwater')).toBeTruthy();
  });

  it('summarises when it ran, for how long, and with what timer', () => {
    renderCard();
    expect(screen.getByText('Last night · 42 min · timer 45m')).toBeTruthy();
  });

  it('leaves the timer out when there was none', () => {
    renderCard({ timerMinutes: null });
    expect(screen.getByText('Last night · 42 min')).toBeTruthy();
  });

  it('resumes from anywhere on the card, not just the play circle', () => {
    renderCard();
    fireEvent.press(screen.getByRole('button', { name: 'Continue Underwater' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows a single play triangle, since the card is one action', () => {
    renderCard();
    expect(screen.getAllByTestId('play-triangle')).toHaveLength(1);
  });

  it('fills the play circle with the accent', () => {
    renderCard();
    expect(StyleSheet.flatten(screen.getByTestId('resume-play').props.style)).toMatchObject({
      backgroundColor: COLORS.light.primary,
      // 54pt, fully rounded.
      borderRadius: 27,
    });
  });

  it('takes the larger hero radius rather than the grid card radius', () => {
    renderCard();
    const style = StyleSheet.flatten(screen.getByTestId('resume-card').props.style) as Record<
      string,
      unknown
    >;
    expect(style.borderRadius).toBe(RADIUS.hero);
    expect(style.shadowOpacity).toBeUndefined();
  });
});

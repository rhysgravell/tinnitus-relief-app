import { fireEvent, render, screen } from '@testing-library/react-native';
import { VolumeSlider } from './VolumeSlider';
import { ThemeProvider } from '../theme/ThemeProvider';
import { COLORS } from '../theme/tokens';

const onChange = jest.fn();

function renderSlider(value = 0.6, hint?: string) {
  render(
    <ThemeProvider scheme="dark">
      <VolumeSlider value={value} onChange={onChange} hint={hint} />
    </ThemeProvider>
  );
  return screen.getByTestId('volume-slider');
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('VolumeSlider', () => {
  it('sits the thumb at the current level', () => {
    expect(renderSlider(0.42).props.value).toBe(0.42);
  });

  it('runs the full range rather than a percentage scale', () => {
    // The store keeps volume as 0–1, and the player takes 0–1. A 0–100 slider would put
    // a conversion between the two for no reason.
    const slider = renderSlider();
    expect(slider.props.minimumValue).toBe(0);
    expect(slider.props.maximumValue).toBe(1);
  });

  it('reports the level as the thumb moves, not only when it is released', () => {
    // The point of the slider is to find the level by ear, which needs the sound to follow
    // the finger.
    const slider = renderSlider();
    fireEvent(slider, 'valueChange', 0.8);
    expect(onChange).toHaveBeenCalledWith(0.8);
  });

  it('names itself for assistive tech, since the ends are glyphs', () => {
    expect(renderSlider().props.accessibilityLabel).toBe('Volume');
  });

  it('tints the played part with the accent and the rest with the track', () => {
    const slider = renderSlider();
    expect(slider.props.minimumTrackTintColor).toBe(COLORS.dark.primary);
    expect(slider.props.maximumTrackTintColor).toBe(COLORS.dark.track);
  });

  it('marks the quiet and loud ends without an icon library', () => {
    renderSlider();
    expect(screen.getByText('◉')).toBeTruthy();
  });

  it('shows guidance under the track when there is some to give', () => {
    renderSlider(0.6, 'Keep it just below the ringing, not over it.');
    expect(screen.getByText('Keep it just below the ringing, not over it.')).toBeTruthy();
  });

  it('leaves the space empty when there is no guidance', () => {
    renderSlider();
    expect(screen.queryByText(/Keep it/)).toBeNull();
  });
});

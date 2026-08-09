import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { Pill } from './Pill';
import { ThemeProvider } from '../theme/ThemeProvider';
import { COLORS, FONT, LAYOUT, RADIUS } from '../theme/tokens';

function pill(name: string) {
  return screen.getByRole('button', { name });
}

function pillStyle(name: string) {
  return StyleSheet.flatten(pill(name).props.style);
}

function labelStyle(name: string) {
  return StyleSheet.flatten(screen.getByText(name).props.style);
}

describe('Pill', () => {
  it('renders its label and reports taps', () => {
    const onPress = jest.fn();
    render(<Pill label="Rain" onPress={onPress} />);
    fireEvent.press(screen.getByText('Rain'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is a fully round outline when unselected', () => {
    render(<Pill label="Rain" />);
    expect(pillStyle('Rain')).toMatchObject({
      borderRadius: RADIUS.pill,
      borderWidth: LAYOUT.hairlineWidth,
      borderColor: COLORS.light.borderStrong,
    });
    expect(pillStyle('Rain').backgroundColor).toBeUndefined();
  });

  it('fills with ink when selected', () => {
    render(<Pill label="All" selected />);
    expect(pillStyle('All').backgroundColor).toBe(COLORS.light.text);
    expect(labelStyle('All').color).toBe(COLORS.light.onPrimary);
  });

  it('keeps its border when selected so the row does not shift', () => {
    // A filled pill that dropped its 1px border would be 2px smaller than its
    // neighbours, and picking a filter would nudge the whole row.
    render(<Pill label="All" selected />);
    const style = pillStyle('All');
    expect(style.borderWidth).toBe(LAYOUT.hairlineWidth);
    expect(style.borderColor).toBe(style.backgroundColor);
  });

  it('fills with the accent for the session timer instead of ink', () => {
    render(
      <ThemeProvider scheme="dark">
        <Pill label="45m" selected tone="primary" size="block" />
      </ThemeProvider>
    );
    expect(pillStyle('45m').backgroundColor).toBe(COLORS.dark.primary);
    expect(labelStyle('45m').color).toBe(COLORS.dark.onPrimary);
  });

  it('weights the label up as it is selected', () => {
    render(
      <>
        <Pill label="Rain" />
        <Pill label="All" selected />
        <Pill label="45m" selected tone="primary" />
      </>
    );
    expect(labelStyle('Rain').fontFamily).toBe(FONT.sans);
    expect(labelStyle('All').fontFamily).toBe(FONT.sansMedium);
    expect(labelStyle('45m').fontFamily).toBe(FONT.sansSemiBold);
  });

  it('shares the row width in the block size', () => {
    // The five session timer pills size from the row, not from their labels, so "∞"
    // is as wide as "60m".
    render(<Pill label="15m" size="block" />);
    expect(pillStyle('15m').flex).toBe(1);
  });

  it('hugs its label in the other sizes', () => {
    render(
      <>
        <Pill label="Calm" />
        <Pill label="Rain" size="compact" />
      </>
    );
    expect(pillStyle('Calm').alignSelf).toBe('flex-start');
    expect(pillStyle('Rain').alignSelf).toBe('flex-start');
    expect(pillStyle('Rain').paddingHorizontal).toBeLessThan(
      Number(pillStyle('Calm').paddingHorizontal)
    );
  });

  it('grows its hit area past the 44pt minimum', () => {
    // The pill itself is 39pt tall at most, so the slop is what makes it tappable.
    render(<Pill label="Rain" />);
    const style = pillStyle('Rain');
    const height = Number(style.paddingVertical) * 2 + 21;
    const slop = Number(pill('Rain').props.hitSlop);
    expect(height + slop * 2).toBeGreaterThanOrEqual(LAYOUT.minTouchTarget);
  });

  it('tells assistive tech which pill is selected', () => {
    render(
      <>
        <Pill label="All" selected />
        <Pill label="Rain" />
      </>
    );
    expect(pill('All').props.accessibilityState).toMatchObject({ selected: true });
    expect(pill('Rain').props.accessibilityState).toMatchObject({
      selected: false,
    });
  });
});

import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { rampIndex, TrendChart } from './TrendChart';
import { ThemeProvider } from '../theme/ThemeProvider';
import { CHART_RAMP, LOUDNESS_HEIGHTS } from '../theme/tokens';
import { TREND_DAYS, TREND_DAYS_WIDE, trendWindow } from '../store/trend';
import type { CheckIn, Loudness } from '../store/checkIns';

const NOW = new Date(2026, 7, 14, 12, 0);

function entry(date: string, loudness: Loudness): CheckIn {
  return { date, loudness, mood: 'calm' };
}

function renderChart(entries: CheckIn[], days = TREND_DAYS) {
  render(
    <ThemeProvider scheme="light">
      <TrendChart testID="chart" days={trendWindow(entries, days, NOW)} />
    </ThemeProvider>
  );
}

function barStyle(date: string) {
  return StyleSheet.flatten(screen.getByTestId(`trend-bar-${date}`).props.style);
}

describe('TrendChart', () => {
  it('draws a bar only for the days that were logged', () => {
    renderChart([entry('2026-08-13', 3), entry('2026-08-14', 2)]);
    expect(screen.getByTestId('trend-bar-2026-08-13')).toBeTruthy();
    expect(screen.getByTestId('trend-bar-2026-08-14')).toBeTruthy();
    expect(screen.queryByTestId('trend-bar-2026-08-12')).toBeNull();
  });

  it('plots each day at the height of the level it was logged at', () => {
    renderChart([entry('2026-08-14', 4)]);
    expect(barStyle('2026-08-14').height).toBe(`${LOUDNESS_HEIGHTS[3]}%`);
  });

  it('darkens towards today, so the direction reads without a legend', () => {
    renderChart([entry('2026-08-01', 3), entry('2026-08-14', 3)]);
    expect(barStyle('2026-08-01').backgroundColor).toBe(CHART_RAMP[0]);
    expect(barStyle('2026-08-14').backgroundColor).toBe(CHART_RAMP[CHART_RAMP.length - 1]);
  });

  it('closes the gaps up when the window widens', () => {
    // Thirty columns at the fortnight's spacing would not fit the card.
    renderChart([], TREND_DAYS);
    const narrow = StyleSheet.flatten(screen.getByTestId('chart').props.style).gap;
    screen.unmount();

    renderChart([], TREND_DAYS_WIDE);
    expect(StyleSheet.flatten(screen.getByTestId('chart').props.style).gap).toBeLessThan(
      Number(narrow)
    );
  });

  it('summarises itself for a screen reader', () => {
    renderChart([entry('2026-08-13', 2), entry('2026-08-14', 4)]);
    expect(screen.getByTestId('chart').props.accessibilityLabel).toBe(
      'Loudness, 2 check-ins over 14 days: from 2 to 4, most recently 4.'
    );
  });
});

describe('rampIndex', () => {
  it('spreads the columns across every shade, oldest to newest', () => {
    const bands = Array.from({ length: 8 }, (_, index) => rampIndex(index, 8));
    expect(bands).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });

  it('puts the newest column in the darkest band', () => {
    expect(rampIndex(13, 14)).toBe(CHART_RAMP.length - 1);
  });

  it('gives a lone column the darkest shade rather than the palest', () => {
    // One bar is today's bar. Drawing it as the oldest shade would read as history.
    expect(rampIndex(0, 1)).toBe(CHART_RAMP.length - 1);
  });
});

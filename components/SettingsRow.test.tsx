import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { StyleSheet, Text as RNText } from 'react-native';
import { SettingsRow } from './SettingsRow';
import { Toggle } from './Toggle';
import { ThemeProvider } from '../theme/ThemeProvider';
import { COLORS, LAYOUT, TYPE } from '../theme/tokens';

function renderRow(props: Partial<Parameters<typeof SettingsRow>[0]> = {}) {
  render(
    <ThemeProvider scheme="light">
      <SettingsRow testID="row" title="Default timer" {...props} />
    </ThemeProvider>
  );
}

function row() {
  return screen.getByTestId('row');
}

describe('SettingsRow', () => {
  it('names the setting', () => {
    renderRow();
    expect(screen.getByText('Default timer')).toBeTruthy();
  });

  it('says in plain English what a setting does, where its title does not', () => {
    renderRow({ title: 'Dark after sunset', description: 'The app dims itself' });
    expect(screen.getByText('The app dims itself')).toBeTruthy();
  });

  it('leaves the description out when there is nothing to explain', () => {
    renderRow();
    expect(screen.queryByText(/dims/)).toBeNull();
  });

  it('reads the title in regular weight, not the semibold of a card title', () => {
    renderRow();
    const style = StyleSheet.flatten(screen.getByText('Default timer').props.style);
    expect(style.fontFamily).toBe(TYPE.rowLabel.fontFamily);
  });

  it('shows the current value on a row that opens something', () => {
    renderRow({ value: '45 min', onPress: () => {} });
    expect(screen.getByText('45 min')).toBeTruthy();
  });

  it('marks a closed row with a chevron and an open one with a caret', () => {
    // The design ships no icon library, so the disclosure is a character.
    renderRow({ value: '45 min', onPress: () => {} });
    expect(screen.getByText('›')).toBeTruthy();

    screen.unmount();
    renderRow({ value: '45 min', onPress: () => {}, expanded: true });
    expect(screen.getByText('⌄')).toBeTruthy();
  });

  it('opens on a tap anywhere along the row', () => {
    const onPress = jest.fn();
    renderRow({ value: '45 min', onPress });

    fireEvent.press(screen.getByRole('button', { name: 'Default timer' }));
    expect(onPress).toHaveBeenCalled();
  });

  it('is a button carrying its value and whether it is open', () => {
    renderRow({ value: '45 min', onPress: () => {}, expanded: true });
    const button = screen.getByRole('button', { name: 'Default timer' });

    expect(button.props.accessibilityValue).toEqual({ text: '45 min' });
    expect(button.props.accessibilityState).toMatchObject({ expanded: true });
  });

  it('reads an abbreviated value out in full', () => {
    // "45 min" is read as "45 min"; the spoken form says minutes.
    renderRow({ value: '45 min', valueAccessibilityLabel: '45 minutes', onPress: () => {} });
    const button = screen.getByRole('button', { name: 'Default timer' });

    expect(button.props.accessibilityValue).toEqual({ text: '45 minutes' });
  });

  it('is not a button when there is nothing to open', () => {
    // A switch row is operated by its switch. A button wrapped around it would be a second
    // target doing nothing.
    renderRow({
      control: (
        <Toggle value onValueChange={() => {}} accessibilityLabel="Fade out at the end" />
      ),
    });

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('switch')).toBeTruthy();
  });

  it('holds what it opens back until it is open', () => {
    renderRow({
      value: 'Off',
      onPress: () => {},
      children: <RNText>the choices</RNText>,
    });
    expect(screen.queryByText('the choices')).toBeNull();

    screen.unmount();
    renderRow({
      value: 'Off',
      onPress: () => {},
      expanded: true,
      children: <RNText>the choices</RNText>,
    });
    expect(screen.getByText('the choices')).toBeTruthy();
  });

  it('keeps what it opened outside its own button', () => {
    // Otherwise a tap on a pill inside would also be a tap on the row, closing it again.
    renderRow({
      value: 'Off',
      onPress: () => {},
      expanded: true,
      children: <RNText>the choices</RNText>,
    });

    expect(screen.getByText('the choices')).toBeTruthy();
    const button = screen.getByRole('button', { name: 'Default timer' });
    expect(within(button).queryByText('the choices')).toBeNull();
  });

  it('separates itself from the row below with the lighter hairline', () => {
    // Cards are bounded by `hairline`; the rows inside them by a step lighter again.
    renderRow({ divider: true });
    const style = StyleSheet.flatten(row().props.style);

    expect(style.borderBottomWidth).toBe(LAYOUT.hairlineWidth);
    expect(style.borderBottomColor).toBe(COLORS.light.hairlineInner);
  });

  it('draws no line under the last row of a group', () => {
    renderRow();
    expect(StyleSheet.flatten(row().props.style)?.borderBottomWidth).toBeUndefined();
  });

  it('stands tall enough to be tapped without a hitSlop', () => {
    // The whole row is the target, so its own padding has to clear the 44pt minimum —
    // there is no slop to grow, and neighbouring rows would overlap it if there were.
    renderRow({ value: 'Off', onPress: () => {} });
    const style = StyleSheet.flatten(screen.getByTestId('settings-row-line').props.style);

    expect(style.paddingVertical * 2 + TYPE.rowLabel.lineHeight).toBeGreaterThanOrEqual(
      LAYOUT.minTouchTarget
    );
  });
});

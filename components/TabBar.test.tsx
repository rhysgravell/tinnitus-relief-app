import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { TABS, TabBar } from './TabBar';
import { COLORS, FONT, LAYOUT } from '../theme/tokens';

const emit = jest.fn(() => ({ defaultPrevented: false }));
const navigate = jest.fn();

/**
 * A bottom tab bar receives the whole navigator state. Only the few fields the bar reads
 * are built here, so the tests do not need a live navigator.
 */
function props(focused: string, { prevented = false } = {}): BottomTabBarProps {
  emit.mockReturnValue({ defaultPrevented: prevented });

  const routes = TABS.map((tab) => ({ key: `${tab.name}-key`, name: tab.name }));

  return {
    state: { index: routes.findIndex((route) => route.name === focused), routes },
    navigation: { emit, navigate },
    insets: { top: 0, right: 0, bottom: 34, left: 0 },
  } as unknown as BottomTabBarProps;
}

function tab(label: string) {
  return screen.getByRole('tab', { name: label });
}

function labelStyle(label: string) {
  return StyleSheet.flatten(screen.getByText(label).props.style);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TabBar', () => {
  it('shows the four tabs in the order the design lays them out', () => {
    render(<TabBar {...props('index')} />);
    expect(screen.getAllByRole('tab').map((node) => node.props.accessibilityLabel)).toEqual([
      'Sounds',
      'Saved',
      'Sleep',
      'Check-in',
    ]);
  });

  it('accents the focused tab and mutes the rest', () => {
    render(<TabBar {...props('saved')} />);
    expect(labelStyle('Saved').color).toBe(COLORS.light.primary);
    expect(labelStyle('Sounds').color).toBe(COLORS.light.textSubtle);
  });

  it('weights the focused label up', () => {
    render(<TabBar {...props('saved')} />);
    expect(labelStyle('Saved').fontFamily).toBe(FONT.sansSemiBold);
    expect(labelStyle('Sounds').fontFamily).toBe(FONT.sans);
  });

  it('separates itself from the screen with a hairline and no shadow', () => {
    render(<TabBar {...props('index')} />);
    const style = StyleSheet.flatten(screen.getByTestId('tab-bar').props.style) as Record<
      string,
      unknown
    >;
    expect(style).toMatchObject({
      borderTopWidth: LAYOUT.hairlineWidth,
      borderTopColor: COLORS.light.hairline,
    });
    expect(style.shadowOpacity).toBeUndefined();
  });

  it('turns dark under Sleep', () => {
    // Sleep is a night surface. A mist-coloured bar under it would cut the screen in half.
    render(<TabBar {...props('sleep')} />);
    expect(StyleSheet.flatten(screen.getByTestId('tab-bar').props.style)).toMatchObject({
      backgroundColor: COLORS.dark.background,
      borderTopColor: COLORS.dark.hairline,
    });
    expect(labelStyle('Sleep').color).toBe(COLORS.dark.primary);
  });

  it('stays light under the day screens', () => {
    render(<TabBar {...props('check-in')} />);
    expect(StyleSheet.flatten(screen.getByTestId('tab-bar').props.style).backgroundColor).toBe(
      COLORS.light.background
    );
  });

  it('leaves room for the home indicator', () => {
    render(<TabBar {...props('index')} />);
    expect(StyleSheet.flatten(screen.getByTestId('tab-bar').props.style).paddingBottom).toBe(34);
  });

  it('navigates to the tab that was pressed', () => {
    render(<TabBar {...props('index')} />);
    fireEvent.press(tab('Sleep'));
    expect(navigate).toHaveBeenCalledWith('sleep');
  });

  it('does not re-navigate to the tab already showing', () => {
    // Navigating to the current tab would reset the screen's own state.
    render(<TabBar {...props('index')} />);
    fireEvent.press(tab('Sounds'));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('lets a screen claim the press for itself', () => {
    // Screens use a prevented tabPress for things like scroll-to-top.
    render(<TabBar {...props('index', { prevented: true })} />);
    fireEvent.press(tab('Sleep'));
    expect(emit).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('tells assistive tech which tab is selected', () => {
    render(<TabBar {...props('sleep')} />);
    expect(tab('Sleep').props.accessibilityState).toMatchObject({ selected: true });
    expect(tab('Saved').props.accessibilityState).toMatchObject({ selected: false });
  });
});

describe('tab manifest', () => {
  it('renames the tabs the redesign renamed', () => {
    expect(TABS.map((entry) => entry.label)).toEqual(['Sounds', 'Saved', 'Sleep', 'Check-in']);
  });

  it('marks Sleep as the only night surface among the tabs', () => {
    expect(TABS.filter((entry) => entry.scheme === 'dark').map((entry) => entry.name)).toEqual([
      'sleep',
    ]);
  });
});

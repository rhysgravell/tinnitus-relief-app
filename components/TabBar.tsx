import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Text } from './Text';
import { TabGlyph } from './TabGlyph';
import type { TabGlyphName } from './TabGlyph';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { LAYOUT, SPACE } from '../theme/tokens';
import type { Scheme } from '../theme/tokens';

export type Tab = {
  /** The route file under `app/(tabs)/`, without its extension. */
  name: string;
  label: string;
  glyph: TabGlyphName;
  /**
   * Whether that screen is one of the night surfaces — dark at any hour. The rest follow
   * the app, which is itself dark after sunset unless that has been turned off.
   */
  nightSurface: boolean;
};

/**
 * The tab manifest, in the order the design lays them out. `app/(tabs)/_layout.tsx`
 * registers its screens from this list, so the bar and the navigator cannot disagree
 * about which tabs exist.
 */
export const TABS: readonly Tab[] = [
  { name: 'index', label: 'Sounds', glyph: 'circle', nightSurface: false },
  { name: 'saved', label: 'Saved', glyph: 'star', nightSurface: false },
  { name: 'sleep', label: 'Sleep', glyph: 'moon', nightSurface: true },
  { name: 'check-in', label: 'Check-in', glyph: 'square', nightSurface: false },
] as const;

/**
 * The bottom tab bar.
 *
 * It adopts the palette of the screen it is sitting under, because Sleep is a night
 * surface and a mist-coloured bar below it would cut the screen in half. Under any other
 * tab that is whatever the app itself is wearing, which after sunset is the night palette
 * too.
 */
export function TabBar({ state, navigation, insets }: BottomTabBarProps) {
  const { scheme: appScheme } = useTheme();
  const focusedRoute = state.routes[state.index]?.name;
  const scheme: Scheme = TABS.find((tab) => tab.name === focusedRoute)?.nightSurface
    ? 'dark'
    : appScheme;

  return (
    <ThemeProvider scheme={scheme}>
      <Bar state={state} navigation={navigation} insets={insets} />
    </ThemeProvider>
  );
}

type BarProps = Pick<BottomTabBarProps, 'state' | 'navigation' | 'insets'>;

/** Split out so the surface can read the scheme the bar just chose. */
function Bar({ state, navigation, insets }: BarProps) {
  const { colors } = useTheme();

  return (
    <View
      testID="tab-bar"
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.hairline,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const tab = TABS.find((candidate) => candidate.name === route.name);
        if (!tab) return null;

        const focused = state.index === index;
        const color = focused ? colors.primary : colors.textSubtle;

        return (
          <Pressable
            key={route.key}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              // A screen can claim the press — scroll-to-top on a second tap, say — and
              // re-navigating to the tab you are already on would reset its state.
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: focused }}
            style={styles.tab}
          >
            <TabGlyph glyph={tab.glyph} focused={focused} color={color} />
            <Text variant={focused ? 'tabLabelActive' : 'tabLabel'} style={{ color }}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: LAYOUT.hairlineWidth,
    paddingTop: SPACE.s10,
    paddingHorizontal: SPACE.s12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: SPACE.s6,
    paddingVertical: SPACE.s6,
  },
});

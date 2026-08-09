import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text as RNText, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SectionLabel } from '../components/SectionLabel';
import { Text } from '../components/Text';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { LAYOUT, SPACE } from '../theme/tokens';

/**
 * The now-playing screen. Registered here so the route and its modal presentation are in
 * place; the screen itself is built in a later PR.
 */
export default function SessionRoute() {
  // Session is a night surface whatever the rest of the app is set to, so it brings its
  // own provider rather than reading the root one.
  return (
    <ThemeProvider scheme="dark">
      <Session />
    </ThemeProvider>
  );
}

function Session() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close session"
          hitSlop={SPACE.s12}
        >
          {/* A text character rather than an icon: this design ships no icon library. */}
          <RNText style={[styles.chevron, { color: colors.textMuted }]}>‹</RNText>
        </Pressable>
        <SectionLabel tone="muted">Session</SectionLabel>
        <View style={styles.chevronSpacer} />
      </View>
      <View style={styles.body}>
        <Text tone="muted">The session screen arrives in a later PR.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACE.s14,
    paddingHorizontal: LAYOUT.screenGutter,
  },
  chevron: {
    fontSize: 26,
    lineHeight: 26,
  },
  /** Keeps the label centred without measuring the chevron. */
  chevronSpacer: {
    width: SPACE.s16,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LAYOUT.screenGutter,
  },
});

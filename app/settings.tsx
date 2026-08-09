import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { Text } from '../components/Text';
import { useTheme } from '../theme/ThemeProvider';
import { LAYOUT } from '../theme/tokens';

/**
 * Settings, reached from the header button on Sounds rather than a fifth tab. Registered
 * here so the push route exists; the screen itself is built in a later PR.
 */
export default function SettingsRoute() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Settings"
        action={
          <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={12}>
            <Text tone="muted">Done</Text>
          </Pressable>
        }
      />
      <View style={styles.body}>
        <Text tone="muted">The settings screen arrives in a later PR.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LAYOUT.screenGutter,
  },
});

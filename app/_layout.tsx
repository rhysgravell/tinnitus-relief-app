import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SoundStateProvider } from '../context/SoundStateContext';
import { ThemeProvider } from '../theme/ThemeProvider';
import { FONT_ASSETS } from '../theme/fonts';

// Both splash calls reject if the splash has already been hidden, which happens on a
// fast refresh. Swallow it rather than surface an unhandled rejection in development.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts(FONT_ASSETS);
  const ready = loaded || error !== null;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  // Hold the splash until the fonts are ready, so text never reflows from a system
  // fallback. If loading fails we render anyway rather than sit on the splash forever.
  if (!ready) {
    return null;
  }

  return (
    <ThemeProvider scheme="light">
      {/* Above the navigator, not inside the tabs: Session is presented from this stack, and
          it reads and writes the same per-sound state the tab screens do. */}
      <SoundStateProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          {/* A sheet rather than a full-screen cover: the design dismisses the session with
              a swipe down as well as the chevron, and iOS only offers that on a sheet. */}
          <Stack.Screen name="session" options={{ presentation: 'modal' }} />
          <Stack.Screen name="settings" />
        </Stack>
      </SoundStateProvider>
    </ThemeProvider>
  );
}

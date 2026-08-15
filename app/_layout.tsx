import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SettingsProvider } from '../context/SettingsContext';
import { SoundStateProvider } from '../context/SoundStateContext';
import { useAppScheme } from '../hooks/useAppScheme';
import { useReminderTaps } from '../hooks/useReminderTaps';
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
    <SettingsProvider>
      <App />
    </SettingsProvider>
  );
}

/**
 * Split from the layout above so it can read the settings provider wrapping it: "Dark
 * after sunset" decides the palette the whole app wears.
 */
function App() {
  const scheme = useAppScheme();
  // Above the navigator, so a reminder tapped from the lock screen has somewhere to go
  // whichever screen the app was left on.
  useReminderTaps();

  return (
    <ThemeProvider scheme={scheme}>
      {/* The clock and the battery are part of the surface. Left to itself the status bar
          draws in dark ink, which disappears against a night screen. */}
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
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

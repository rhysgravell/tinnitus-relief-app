import { useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../theme/ThemeProvider';

/**
 * The status bar's ink, for a screen whose palette is not the app's.
 *
 * The root sets this once for the app as a whole, which is right for every screen that
 * takes the app's own scheme. Session and Sleep do not — they are night surfaces at any
 * hour — so in the daytime they have to overrule it, and hand it straight back when they
 * are no longer the screen being looked at.
 *
 * Focus, rather than mounting, is what that turns on: a tab screen stays mounted after you
 * have left it, and Sleep's white-on-dark status bar left standing over Sounds would be
 * worse than the problem it fixes.
 */
export function ScreenStatusBar() {
  const { scheme } = useTheme();
  const [focused, setFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, [])
  );

  if (!focused) return null;

  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

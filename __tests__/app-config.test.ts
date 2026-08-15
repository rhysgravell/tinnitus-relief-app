import appConfig from '../app.json';
import { COLORS } from '../theme/tokens';

const { expo } = appConfig;

describe('app config', () => {
  it('is named as the design names it', () => {
    // The Settings footer reads this rather than keeping its own copy of the name.
    expect(expo.name).toBe('Quiet');
  });

  it('lets the system decide the appearance', () => {
    // Not a style preference: pinning this to light or dark pins what `useColorScheme`
    // answers with, and "Dark after sunset" is that answer. The app would be stuck in one
    // palette with a switch that appeared to do nothing.
    expect(expo.userInterfaceStyle).toBe('automatic');
  });

  it('opens on the palette the first screen is painted in', () => {
    // The splash sits under the app for a frame either side of the handover.
    expect(expo.splash.backgroundColor).toBe(COLORS.light.background);
  });

  it('falls back to a colour from this design behind the app icon', () => {
    // Only ever seen where Android cannot use the background image. The icon artwork
    // itself is still the pre-redesign blue.
    expect(expo.android.adaptiveIcon.backgroundColor).toBe(COLORS.dark.background);
  });
});

import appConfig from '../app.json';
import { COLORS } from '../theme/tokens';

const { expo } = appConfig;

/** A plugin's options, or undefined for one listed bare. */
function pluginOptions(name: string): Record<string, unknown> | undefined {
  const entry = expo.plugins.find(
    (plugin) => plugin === name || (Array.isArray(plugin) && plugin[0] === name)
  );
  return Array.isArray(entry) ? (entry[1] as Record<string, unknown>) : undefined;
}

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

describe('the audio plugin', () => {
  it('never asks for the microphone', () => {
    // Left to itself it adds RECORD_AUDIO on Android and a microphone usage string on
    // iOS, both of which this app would be asking for on false pretences: it plays sound
    // and has never recorded any. On the Play listing it would read as a reason not to
    // install a tinnitus app.
    expect(pluginOptions('expo-audio')).toMatchObject({
      microphonePermission: false,
      recordAudioAndroid: false,
    });
  });

  it('keeps playing with the app in the background', () => {
    // The whole job happens at 3am with the screen locked. This is the default today, and
    // spelled out so a change of default cannot take it away quietly.
    expect(pluginOptions('expo-audio')).toMatchObject({ enableBackgroundPlayback: true });
  });
});

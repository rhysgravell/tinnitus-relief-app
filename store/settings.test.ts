import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_SETTINGS,
  TIMER_OPTIONS,
  getSettings,
  timerAccessibilityLabel,
  timerLabel,
  updateSettings,
} from './settings';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('settings', () => {
  it('starts from the defaults', async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('persists a single changed setting', async () => {
    await updateSettings({ fadeOut: false });
    expect((await getSettings()).fadeOut).toBe(false);
  });

  it('leaves other settings alone when one changes', async () => {
    await updateSettings({ fadeOut: false });
    const settings = await getSettings();
    expect(settings.darkAfterSunset).toBe(DEFAULT_SETTINGS.darkAfterSunset);
    expect(settings.defaultTimerMinutes).toBe(DEFAULT_SETTINGS.defaultTimerMinutes);
  });

  it('stores a null timer and reminder rather than dropping them', async () => {
    // null is meaningful here: no timer, and no reminder. A naive merge would let the
    // defaults win back over both.
    await updateSettings({ defaultTimerMinutes: null, reminderTime: null });
    const settings = await getSettings();
    expect(settings.defaultTimerMinutes).toBeNull();
    expect(settings.reminderTime).toBeNull();
  });

  it('fills in a setting missing from previously stored state', async () => {
    await AsyncStorage.setItem('settings', JSON.stringify({ fadeOut: false }));
    const settings = await getSettings();
    expect(settings.fadeOut).toBe(false);
    expect(settings.mixWithOthers).toBe(DEFAULT_SETTINGS.mixWithOthers);
  });
});

describe('timer options', () => {
  it('offers the four presets and the infinite option', () => {
    expect(TIMER_OPTIONS).toEqual([15, 30, 45, 60, null]);
  });

  it('offers the default timer as one of the options', () => {
    // A default the timer row cannot show would leave the session opening on no pill.
    expect(TIMER_OPTIONS).toContain(DEFAULT_SETTINGS.defaultTimerMinutes);
  });

  it('abbreviates a preset and marks the infinite option with a glyph', () => {
    expect(timerLabel(45)).toBe('45m');
    expect(timerLabel(null)).toBe('∞');
  });

  it('spells the labels out for assistive tech', () => {
    expect(timerAccessibilityLabel(45)).toBe('45 minutes');
    expect(timerAccessibilityLabel(null)).toBe('No timer');
  });
});

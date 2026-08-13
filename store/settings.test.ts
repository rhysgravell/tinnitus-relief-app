import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_SETTINGS,
  REMINDER_TIMES,
  TIMER_OPTIONS,
  getSettings,
  reminderPatch,
  reminderSetting,
  timerAccessibilityLabel,
  timerLabel,
  timerSettingLabel,
  updateSettings,
} from './settings';
import { formatTimeOfDay, parseTimeOfDay } from '../utils/time';

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

  it('stores a null timer rather than dropping it', async () => {
    // null is meaningful here: no timer at all. A naive merge would let the default win
    // back over it.
    await updateSettings({ defaultTimerMinutes: null });
    expect((await getSettings()).defaultTimerMinutes).toBeNull();
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

  it('spells the length out on a settings row, where there is room for it', () => {
    expect(timerSettingLabel(45)).toBe('45 min');
    expect(timerSettingLabel(null)).toBe('No timer');
  });

  it('spells the labels out for assistive tech', () => {
    expect(timerAccessibilityLabel(45)).toBe('45 minutes');
    expect(timerAccessibilityLabel(null)).toBe('No timer');
  });
});

describe('the reminders', () => {
  it('both start switched off', async () => {
    // Turning one on asks the OS for permission to notify. Asking before the user has shown
    // any interest in a reminder is the wrong way round.
    const settings = await getSettings();
    expect(settings.windDownEnabled).toBe(false);
    expect(settings.checkInEnabled).toBe(false);
  });

  it('reads a stored time as a clock time', () => {
    expect(reminderSetting({ ...DEFAULT_SETTINGS, windDownTime: '21:15' }, 'windDown').at).toEqual({
      hour: 21,
      minute: 15,
    });
  });

  it('reads each kind from its own keys', () => {
    // Both live in the same settings object, so a mix-up would still look plausible.
    const settings = { ...DEFAULT_SETTINGS, windDownTime: '22:00', checkInTime: '19:30' };
    expect(reminderSetting(settings, 'windDown').at).toEqual({ hour: 22, minute: 0 });
    expect(reminderSetting(settings, 'checkIn').at).toEqual({ hour: 19, minute: 30 });
  });

  it('falls back to the default for a stored value that is not a time', () => {
    // Rather than leaving a reminder on with nothing behind it.
    expect(reminderSetting({ ...DEFAULT_SETTINGS, windDownTime: 'bedtime' }, 'windDown')).toEqual(
      reminderSetting(DEFAULT_SETTINGS, 'windDown')
    );
  });

  it('winds down at half past ten and asks about the day at nine', () => {
    expect(reminderSetting(DEFAULT_SETTINGS, 'windDown').at).toEqual({ hour: 22, minute: 30 });
    expect(reminderSetting(DEFAULT_SETTINGS, 'checkIn').at).toEqual({ hour: 21, minute: 0 });
  });

  it('keeps the stored strings and the clock times in step', () => {
    expect(DEFAULT_SETTINGS.windDownTime).toBe('22:30');
    expect(DEFAULT_SETTINGS.checkInTime).toBe('21:00');
  });

  it('writes the switch and the time together', () => {
    expect(reminderPatch('windDown', { enabled: true, at: { hour: 23, minute: 0 } })).toEqual({
      windDownEnabled: true,
      windDownTime: '23:00',
    });
  });

  it('writes each kind to its own keys', () => {
    expect(reminderPatch('checkIn', { enabled: false, at: { hour: 20, minute: 30 } })).toEqual({
      checkInEnabled: false,
      checkInTime: '20:30',
    });
  });

  it('round-trips through storage', async () => {
    await updateSettings(reminderPatch('checkIn', { enabled: true, at: { hour: 19, minute: 30 } }));
    const stored = reminderSetting(await getSettings(), 'checkIn');

    expect(stored).toEqual({ enabled: true, at: { hour: 19, minute: 30 } });
  });
});

describe('the reminder times on offer', () => {
  it('covers the evening in half hours', () => {
    expect(REMINDER_TIMES.map(formatTimeOfDay)).toEqual([
      '19:00',
      '19:30',
      '20:00',
      '20:30',
      '21:00',
      '21:30',
      '22:00',
      '22:30',
      '23:00',
      '23:30',
    ]);
  });

  it('offers both defaults, so a row always opens on a pill that is there', () => {
    const labels = REMINDER_TIMES.map(formatTimeOfDay);
    expect(labels).toContain(DEFAULT_SETTINGS.windDownTime);
    expect(labels).toContain(DEFAULT_SETTINGS.checkInTime);
  });

  it('offers only real times', () => {
    for (const at of REMINDER_TIMES) {
      expect(parseTimeOfDay(formatTimeOfDay(at))).toEqual(at);
    }
  });
});

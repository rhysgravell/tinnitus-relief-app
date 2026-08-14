import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SettingsProvider, useSettings } from './SettingsContext';
import * as settings from '../store/settings';
import { DEFAULT_SETTINGS } from '../store/settings';

function wrapper({ children }: { children: ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>;
}

function renderSettings() {
  return renderHook(() => useSettings(), { wrapper });
}

async function setup() {
  const rendered = renderSettings();
  await waitFor(() => expect(rendered.result.current.settings).not.toBeNull());
  return rendered;
}

beforeEach(() => {
  jest.restoreAllMocks();
  jest.spyOn(settings, 'getSettings').mockResolvedValue(DEFAULT_SETTINGS);
  jest.spyOn(settings, 'updateSettings').mockResolvedValue(DEFAULT_SETTINGS);
});

describe('useSettings', () => {
  it('holds nothing back until the read lands', async () => {
    // Rows rendered against a guess would flip under the reader a moment later.
    const { result } = renderSettings();
    expect(result.current.settings).toBeNull();
    await act(async () => {});
  });

  it('opens on what was stored', async () => {
    jest
      .spyOn(settings, 'getSettings')
      .mockResolvedValue({ ...DEFAULT_SETTINGS, fadeOut: false, defaultTimerMinutes: 15 });
    const { result } = await setup();

    expect(result.current.settings).toMatchObject({ fadeOut: false, defaultTimerMinutes: 15 });
  });

  it('shows a change before it has been written', async () => {
    // A switch that waited on AsyncStorage would lag the thumb.
    jest.spyOn(settings, 'updateSettings').mockReturnValue(new Promise(() => {}));
    const { result } = await setup();

    act(() => result.current.update({ fadeOut: false }));
    expect(result.current.settings?.fadeOut).toBe(false);
  });

  it('writes only what changed', async () => {
    const { result } = await setup();
    await act(async () => result.current.update({ mixWithOthers: true }));

    expect(settings.updateSettings).toHaveBeenCalledWith({ mixWithOthers: true });
  });

  it('leaves the other settings where they were', async () => {
    const { result } = await setup();
    await act(async () => result.current.update({ mixWithOthers: true }));

    expect(result.current.settings).toEqual({ ...DEFAULT_SETTINGS, mixWithOthers: true });
  });

  it('writes nothing of its own accord', async () => {
    // Reading is not a reason to write. A write on mount would stamp this build's defaults
    // over settings an older one had stored.
    await setup();
    expect(settings.updateSettings).not.toHaveBeenCalled();
  });

  it('reads storage once however many screens are asking', async () => {
    await renderTwoConsumers();
    expect(settings.getSettings).toHaveBeenCalledTimes(1);
  });

  it('tells everything reading it about a change at once', async () => {
    // The palette is one of these settings, so the switch that changes it and the screen
    // it sits on cannot be looking at two different copies.
    const { result } = await renderTwoConsumers();

    await act(async () => result.current.first.update({ darkAfterSunset: false }));

    expect(result.current.first.settings?.darkAfterSunset).toBe(false);
    expect(result.current.second.settings?.darkAfterSunset).toBe(false);
  });

  it('throws outside a provider', async () => {
    // Silently falling back to the defaults would look like it worked and lose every change.
    expect(() => renderHook(() => useSettings())).toThrow(/SettingsProvider/);
  });
});

/** Two separate `useSettings` calls under one provider, as two screens would be. */
async function renderTwoConsumers() {
  const rendered = renderHook(() => ({ first: useSettings(), second: useSettings() }), {
    wrapper,
  });
  await waitFor(() => expect(rendered.result.current.first.settings).not.toBeNull());
  return rendered;
}

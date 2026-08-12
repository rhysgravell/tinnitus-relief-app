import { act, renderHook } from '@testing-library/react-native';
import { useCheckIn } from './useCheckIn';
import * as checkIns from '../store/checkIns';
import type { CheckIn } from '../store/checkIns';

/** Midday on 14 August 2026, the day every one of these tests is "today". */
const NOW = new Date(2026, 7, 14, 12, 0);

const yesterday: CheckIn = { date: '2026-08-13', loudness: 4, mood: 'tired' };
const logged: CheckIn = { date: '2026-08-14', loudness: 2, mood: 'calm' };

function history(entries: CheckIn[]) {
  jest.spyOn(checkIns, 'getCheckIns').mockResolvedValue(entries);
}

/** Mounts and does the read the screen's focus effect would do. */
async function setup() {
  const rendered = renderHook(() => useCheckIn());
  await act(async () => {
    await rendered.result.current.refresh();
  });
  expect(rendered.result.current.ready).toBe(true);
  return rendered;
}

beforeEach(() => {
  jest.restoreAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  history([]);
  jest.spyOn(checkIns, 'saveCheckIn').mockImplementation(async (entry) => [entry]);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useCheckIn', () => {
  it('reads nothing until it is asked to', async () => {
    // The screen asks on focus, which is also its first read — so there is no mount read
    // for the focus one to race.
    const { result } = renderHook(() => useCheckIn());
    expect(result.current.ready).toBe(false);
    expect(result.current.draft).toEqual({ loudness: null, mood: null });
    expect(checkIns.getCheckIns).not.toHaveBeenCalled();
  });

  it('opens on an empty draft for a day with nothing logged', async () => {
    history([yesterday]);
    const { result } = await setup();

    expect(result.current.draft).toEqual({ loudness: null, mood: null });
    expect(result.current.status).toBe('incomplete');
  });

  it('opens on what was logged today rather than on a blank form', async () => {
    // Coming back to the screen should show the day as it stands, not ask again.
    history([yesterday, logged]);
    const { result } = await setup();

    expect(result.current.draft).toEqual({ loudness: 2, mood: 'calm' });
    expect(result.current.status).toBe('saved');
  });

  it('hands back the whole history for the trend', async () => {
    history([yesterday, logged]);
    const { result } = await setup();
    expect(result.current.entries).toEqual([yesterday, logged]);
  });

  it('is ready to save once both answers are in', async () => {
    const { result } = await setup();

    act(() => result.current.setLoudness(3));
    expect(result.current.status).toBe('incomplete');

    act(() => result.current.setMood('low'));
    expect(result.current.status).toBe('new');
  });

  it('writes the entry under today and keeps what came back', async () => {
    const { result } = await setup();

    act(() => result.current.setLoudness(3));
    act(() => result.current.setMood('low'));
    await act(async () => result.current.save());

    expect(checkIns.saveCheckIn).toHaveBeenCalledWith({
      date: '2026-08-14',
      loudness: 3,
      mood: 'low',
    });
    expect(result.current.status).toBe('saved');
    expect(result.current.entries).toEqual([{ date: '2026-08-14', loudness: 3, mood: 'low' }]);
  });

  it('goes back to changed as soon as an answer is edited again', async () => {
    history([logged]);
    const { result } = await setup();

    act(() => result.current.setLoudness(5));
    expect(result.current.status).toBe('changed');
  });

  it('refuses to write a half-answered day', async () => {
    const { result } = await setup();

    act(() => result.current.setLoudness(3));
    await act(async () => result.current.save());

    expect(checkIns.saveCheckIn).not.toHaveBeenCalled();
  });

  it('leaves an unsaved answer alone when the screen is returned to', async () => {
    const { result } = await setup();
    act(() => result.current.setMood('good'));

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.draft.mood).toBe('good');
  });

  it('picks up an entry written elsewhere on the same day', async () => {
    const { result } = await setup();
    history([logged]);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.entries).toEqual([logged]);
  });

  it('starts a fresh day when the date rolls over', async () => {
    // The screen can sit open past midnight. Yesterday's half-answer is not today's.
    history([logged]);
    const { result } = await setup();
    expect(result.current.draft).toEqual({ loudness: 2, mood: 'calm' });

    jest.setSystemTime(new Date(2026, 7, 15, 0, 30));
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.draft).toEqual({ loudness: null, mood: null });
    expect(result.current.status).toBe('incomplete');
  });

  it('files a check-in saved after midnight under the new day', async () => {
    const { result } = await setup();
    act(() => result.current.setLoudness(3));
    act(() => result.current.setMood('low'));

    jest.setSystemTime(new Date(2026, 7, 15, 0, 30));
    await act(async () => result.current.save());

    expect(checkIns.saveCheckIn).toHaveBeenCalledWith({
      date: '2026-08-15',
      loudness: 3,
      mood: 'low',
    });
  });
});

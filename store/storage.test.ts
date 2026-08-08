import AsyncStorage from '@react-native-async-storage/async-storage';
import { readJson, writeJson } from './storage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('readJson', () => {
  it('returns the fallback when nothing is stored', async () => {
    expect(await readJson('missing', { a: 1 })).toEqual({ a: 1 });
  });

  it('round-trips a written value', async () => {
    await writeJson('key', { nested: [1, 2, 3] });
    expect(await readJson('key', null)).toEqual({ nested: [1, 2, 3] });
  });

  it('returns the fallback when the stored JSON is corrupt', async () => {
    await AsyncStorage.setItem('key', '{not json');
    expect(await readJson('key', 'fallback')).toBe('fallback');
  });

  it('preserves a stored null rather than treating it as missing', async () => {
    await writeJson('key', null);
    expect(await readJson('key', 'fallback')).toBeNull();
  });

  it('preserves falsy stored values', async () => {
    await writeJson('zero', 0);
    await writeJson('no', false);
    expect(await readJson('zero', 99)).toBe(0);
    expect(await readJson('no', true)).toBe(false);
  });
});

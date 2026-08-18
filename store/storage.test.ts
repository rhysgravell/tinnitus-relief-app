import AsyncStorage from '@react-native-async-storage/async-storage';
import { readJson, removeKey, updateJson, writeJson } from './storage';

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

describe('removeKey', () => {
  it('leaves the key reading as missing', async () => {
    await writeJson('key', { a: 1 });
    await removeKey('key');
    expect(await readJson('key', 'fallback')).toBe('fallback');
  });

  it('says nothing about a key that was never there', async () => {
    await expect(removeKey('missing')).resolves.toBeUndefined();
  });
});

describe('updateJson', () => {
  it('gives the caller back what it wrote', async () => {
    await writeJson('key', { a: 1 });
    const next = await updateJson<{ a: number }>('key', { a: 0 }, (current) => ({ a: current.a + 1 }));

    expect(next).toEqual({ a: 2 });
    expect(await readJson('key', null)).toEqual({ a: 2 });
  });

  it('starts from the fallback when nothing is stored', async () => {
    expect(await updateJson<number>('key', 7, (n) => n + 1)).toBe(8);
  });

  it('runs one update at a time on a key', async () => {
    // The point of the whole thing. Overlapping, all three would read 0 and all three
    // would write 1 — which is a star tapped after another one going missing.
    await Promise.all([
      updateJson<number>('count', 0, (n) => n + 1),
      updateJson<number>('count', 0, (n) => n + 1),
      updateJson<number>('count', 0, (n) => n + 1),
    ]);

    expect(await readJson('count', 0)).toBe(3);
  });

  it('keeps separate keys separate', async () => {
    await Promise.all([
      updateJson<number>('a', 0, (n) => n + 1),
      updateJson<number>('b', 0, (n) => n + 10),
    ]);

    expect(await readJson('a', 0)).toBe(1);
    expect(await readJson('b', 0)).toBe(10);
  });

  it('hands a failure to the caller', async () => {
    await expect(
      updateJson<number>('key', 0, () => {
        throw new Error('nothing to write');
      })
    ).rejects.toThrow('nothing to write');
  });

  it('does not wedge a key behind an update that failed', async () => {
    // Every later change to the key would otherwise be dropped behind the broken one.
    await expect(
      updateJson<number>('key', 0, () => {
        throw new Error('nothing to write');
      })
    ).rejects.toThrow();

    await updateJson<number>('key', 0, (n) => n + 1);
    expect(await readJson('key', 0)).toBe(1);
  });
});

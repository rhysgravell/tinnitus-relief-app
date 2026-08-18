import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Reads a JSON value, falling back when the key is absent or holds unparseable JSON.
 * A corrupt entry is treated exactly like a missing one: this app's job happens at 3am,
 * so a bad write from a previous version must never stop it from opening.
 */
export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

/** The update in flight for each key, so the next one can wait for it. */
const queues = new Map<string, Promise<unknown>>();

/**
 * A read-modify-write update, run one at a time per key.
 *
 * Every store here changes state by reading the whole value back, changing part of it, and
 * writing it again. Two of those overlapping both read the same copy, so the second write
 * lands on top of the first and takes it with it: a star tapped a moment after another one
 * is gone by the next launch, while the screen goes on showing it saved. Queueing the
 * updates means each one reads what the last one left.
 *
 * The whole read-modify-write goes inside `change`, deliberately. A decision made from a
 * read taken beforehand — "it was not saved, so save it" — is the same race one step back.
 *
 * Queued per key rather than globally, because these stores share none: a session being
 * written has no reason to wait behind a check-in.
 */
export function updateJson<T, U = T>(
  key: string,
  fallback: T,
  change: (current: T) => U
): Promise<U> {
  const done = (queues.get(key) ?? Promise.resolve()).then(async () => {
    const next = change(await readJson(key, fallback));
    await writeJson(key, next);
    return next;
  });

  // The queue must not stop at a failed write, or every later change to this key would be
  // dropped behind it. The failure still reaches the caller, through `done` itself.
  queues.set(
    key,
    done.catch(() => {})
  );

  return done;
}

/** Drops a key entirely. For a migration, once what it held has been carried over. */
export async function removeKey(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

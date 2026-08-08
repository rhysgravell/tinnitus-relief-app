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

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'favourites';

export async function getFavourites(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function toggleFavourite(id: string): Promise<string[]> {
  const current = await getFavourites();
  const updated = current.includes(id)
    ? current.filter((f) => f !== id)
    : [...current, id];
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}

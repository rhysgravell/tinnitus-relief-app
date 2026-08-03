import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFavourites, toggleFavourite } from './favourites';

describe('favourites store', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns an empty array when nothing is stored', async () => {
    expect(await getFavourites()).toEqual([]);
  });

  it('adds an id on first toggle', async () => {
    const result = await toggleFavourite('rain');
    expect(result).toEqual(['rain']);
    expect(await getFavourites()).toEqual(['rain']);
  });

  it('removes an id on second toggle', async () => {
    await toggleFavourite('rain');
    const result = await toggleFavourite('rain');
    expect(result).toEqual([]);
    expect(await getFavourites()).toEqual([]);
  });

  it('keeps other ids when toggling one off', async () => {
    await toggleFavourite('rain');
    await toggleFavourite('waves');
    const result = await toggleFavourite('rain');
    expect(result).toEqual(['waves']);
  });
});

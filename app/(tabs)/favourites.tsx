import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { SoundscapeCard } from '../../components/SoundscapeCard';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { SOUNDSCAPES } from '../../store/soundscapes';
import { getFavourites, toggleFavourite } from '../../store/favourites';

export default function FavouritesScreen() {
  const { playingId, isLoading, toggle } = useAudioPlayer();
  const [favourites, setFavourites] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      getFavourites().then(setFavourites);
    }, [])
  );

  const handleFavourite = useCallback(async (id: string) => {
    const updated = await toggleFavourite(id);
    setFavourites(updated);
  }, []);

  const favouriteSoundscapes = SOUNDSCAPES.filter((s) => favourites.includes(s.id));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Favourites</Text>
        <Text style={styles.subheading}>Your saved soundscapes</Text>
      </View>
      {favouriteSoundscapes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No favourites yet.</Text>
          <Text style={styles.emptyHint}>
            Tap the ☆ on any soundscape to save it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={favouriteSoundscapes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <SoundscapeCard
              soundscape={item}
              isPlaying={playingId === item.id}
              isLoading={isLoading && playingId === item.id}
              isFavourite={true}
              onPress={() => toggle(item)}
              onFavouritePress={() => handleFavourite(item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1628',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  heading: {
    color: '#e8f0fe',
    fontSize: 28,
    fontWeight: '700',
  },
  subheading: {
    color: '#7a8aa0',
    fontSize: 15,
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 16,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#e8f0fe',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyHint: {
    color: '#7a8aa0',
    fontSize: 14,
    textAlign: 'center',
  },
});

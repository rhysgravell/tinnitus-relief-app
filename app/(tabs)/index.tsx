import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SoundscapeCard } from '../../components/SoundscapeCard';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { SOUNDSCAPES } from '../../store/soundscapes';
import { getFavourites, toggleFavourite } from '../../store/favourites';

export default function HomeScreen() {
  const { playingId, isLoading, toggle } = useAudioPlayer();
  const [favourites, setFavourites] = useState<string[]>([]);

  useEffect(() => {
    getFavourites().then(setFavourites);
  }, []);

  const handleFavourite = useCallback(async (id: string) => {
    const updated = await toggleFavourite(id);
    setFavourites(updated);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Tinnitus Relief</Text>
        <Text style={styles.subheading}>Choose a soundscape</Text>
      </View>
      {SOUNDSCAPES.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No soundscapes yet.</Text>
          <Text style={styles.emptyHint}>
            Add your Ableton exports to assets/sounds/ and register them in store/soundscapes.ts
          </Text>
        </View>
      ) : (
        <FlatList
          data={SOUNDSCAPES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <SoundscapeCard
              soundscape={item}
              isPlaying={playingId === item.id}
              isLoading={isLoading && playingId === item.id}
              isFavourite={favourites.includes(item.id)}
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
    lineHeight: 20,
  },
});

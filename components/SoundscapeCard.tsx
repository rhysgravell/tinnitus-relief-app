import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Soundscape } from '../hooks/useAudioPlayer';

type Props = {
  soundscape: Soundscape;
  isPlaying: boolean;
  isLoading: boolean;
  isFavourite: boolean;
  onPress: () => void;
  onFavouritePress: () => void;
};

export function SoundscapeCard({
  soundscape,
  isPlaying,
  isLoading,
  isFavourite,
  onPress,
  onFavouritePress,
}: Props) {
  return (
    <View style={[styles.card, isPlaying && styles.cardActive]}>
      <Pressable style={styles.info} onPress={onPress}>
        <Text style={styles.title}>{soundscape.title}</Text>
        <Text style={styles.description}>{soundscape.description}</Text>
      </Pressable>
      <View style={styles.actions}>
        <Pressable onPress={onFavouritePress} style={styles.iconButton}>
          <Text style={styles.icon}>{isFavourite ? '★' : '☆'}</Text>
        </Pressable>
        <Pressable onPress={onPress} style={[styles.playButton, isPlaying && styles.playButtonActive]}>
          <Text style={styles.playIcon}>
            {isLoading ? '…' : isPlaying ? '■' : '▶'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111e35',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e2d4a',
  },
  cardActive: {
    borderColor: '#7eb8f7',
  },
  info: {
    flex: 1,
  },
  title: {
    color: '#e8f0fe',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    color: '#7a8aa0',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  icon: {
    fontSize: 22,
    color: '#f0c040',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e3a5f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonActive: {
    backgroundColor: '#7eb8f7',
  },
  playIcon: {
    color: '#fff',
    fontSize: 16,
  },
});

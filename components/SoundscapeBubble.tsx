import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Soundscape } from '../hooks/useAudioPlayer';

type Props = {
  soundscape: Soundscape;
  size: number;
  tone: 'a' | 'b';
  isPlaying: boolean;
  isLoading: boolean;
  isFavourite: boolean;
  hasError: boolean;
  onPress: () => void;
  onFavouritePress: () => void;
};

export function SoundscapeBubble({
  soundscape,
  size,
  tone,
  isPlaying,
  isLoading,
  isFavourite,
  hasError,
  onPress,
  onFavouritePress,
}: Props) {
  return (
    <View style={{ width: size, height: size }}>
      <Pressable
        onPress={onPress}
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2 },
          tone === 'a' ? styles.toneA : styles.toneB,
          isPlaying && styles.circlePlaying,
          hasError && styles.circleError,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color="#e8f0fe" />
        ) : (
          <Text style={[styles.title, hasError && styles.titleError]} numberOfLines={3}>
            {hasError ? 'Failed to load' : soundscape.title}
          </Text>
        )}
      </Pressable>
      <Pressable onPress={onFavouritePress} style={styles.favouriteBadge} hitSlop={8}>
        <Text style={styles.favouriteIcon}>{isFavourite ? '★' : '☆'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  toneA: {
    backgroundColor: '#173753',
  },
  toneB: {
    backgroundColor: '#215268',
  },
  circlePlaying: {
    borderColor: '#7eb8f7',
    borderWidth: 2,
  },
  circleError: {
    borderColor: '#e05555',
    borderWidth: 2,
  },
  title: {
    color: '#e8f0fe',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  titleError: {
    color: '#ffd7d7',
  },
  favouriteBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(10,22,40,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favouriteIcon: {
    fontSize: 15,
    color: '#f0c040',
  },
});

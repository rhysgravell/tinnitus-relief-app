import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SoundscapeBubble } from '../../components/SoundscapeBubble';
import { useFavourites } from '../../context/FavouritesContext';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { GRID_PADDING, COLUMN_GAP, useBubbleGrid } from '../../hooks/useBubbleGrid';
import { TIMER_PRESETS, TimerPreset, useSleepTimer } from '../../hooks/useSleepTimer';
import { SOUNDSCAPES } from '../../store/soundscapes';

export default function HomeScreen() {
  const { playingId, loadingId, errorId, toggle, stop } = useAudioPlayer();
  const { favourites, toggleFavourite } = useFavourites();
  const { minutesRemaining, start: startTimer, cancel: cancelTimer } = useSleepTimer(stop);
  const { circleSize, leftColumn, rightColumn } = useBubbleGrid(SOUNDSCAPES);

  const handleTimerPress = useCallback(
    (minutes: TimerPreset) => {
      if (minutesRemaining !== null) {
        cancelTimer();
      } else {
        startTimer(minutes);
      }
    },
    [minutesRemaining, startTimer, cancelTimer]
  );

  const renderBubble = (item: (typeof SOUNDSCAPES)[number], tone: 'a' | 'b') => (
    <View key={item.id} style={{ marginBottom: COLUMN_GAP }}>
      <SoundscapeBubble
        soundscape={item}
        size={circleSize}
        tone={tone}
        isPlaying={playingId === item.id}
        isLoading={loadingId === item.id}
        isFavourite={favourites.includes(item.id)}
        hasError={errorId === item.id}
        onPress={() => toggle(item)}
        onFavouritePress={() => toggleFavourite(item.id)}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Tinnitus Relief</Text>
        <Text style={styles.subheading}>Choose a soundscape</Text>
      </View>
      <View style={styles.timerRow}>
        {minutesRemaining !== null ? (
          <>
            <Text style={styles.timerCountdown}>⏱ {minutesRemaining}m remaining</Text>
            <Pressable onPress={cancelTimer} style={styles.timerCancel}>
              <Text style={styles.timerCancelText}>Cancel</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.timerLabel}>Sleep timer:</Text>
            {TIMER_PRESETS.map((m) => (
              <Pressable key={m} onPress={() => handleTimerPress(m)} style={styles.timerChip}>
                <Text style={styles.timerChipText}>{m}m</Text>
              </Pressable>
            ))}
          </>
        )}
      </View>
      {SOUNDSCAPES.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No soundscapes yet.</Text>
          <Text style={styles.emptyHint}>
            Add your audio exports to assets/sounds/ and register them in store/soundscapes.ts
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          <View style={{ width: circleSize }}>{leftColumn.map((item, i) => renderBubble(item, i % 2 === 0 ? 'a' : 'b'))}</View>
          <View style={{ width: circleSize, marginTop: circleSize / 2 }}>
            {rightColumn.map((item, i) => renderBubble(item, i % 2 === 0 ? 'b' : 'a'))}
          </View>
        </ScrollView>
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
    paddingBottom: 12,
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
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  timerLabel: {
    color: '#7a8aa0',
    fontSize: 13,
  },
  timerChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#111e35',
    borderWidth: 1,
    borderColor: '#1e2d4a',
  },
  timerChipText: {
    color: '#7eb8f7',
    fontSize: 13,
  },
  timerCountdown: {
    color: '#7eb8f7',
    fontSize: 13,
    flex: 1,
  },
  timerCancel: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#1e2d4a',
  },
  timerCancelText: {
    color: '#e8f0fe',
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 24,
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

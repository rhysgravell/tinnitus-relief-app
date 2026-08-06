import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MoodBubble } from '../../components/MoodBubble';
import { COLUMN_GAP, GRID_PADDING, useBubbleGrid } from '../../hooks/useBubbleGrid';
import { MOODS } from '../../store/moods';

export default function MoodScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { circleSize, leftColumn, rightColumn } = useBubbleGrid(MOODS);

  const renderBubble = (mood: (typeof MOODS)[number], tone: 'a' | 'b') => (
    <View key={mood.id} style={{ marginBottom: COLUMN_GAP }}>
      <MoodBubble
        mood={mood}
        size={circleSize}
        tone={tone}
        isSelected={selectedId === mood.id}
        onPress={() => setSelectedId(mood.id)}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Mood</Text>
        <Text style={styles.subheading}>Track how you&rsquo;re feeling</Text>
      </View>
      <ScrollView contentContainerStyle={styles.grid}>
        <View style={{ width: circleSize }}>{leftColumn.map((item, i) => renderBubble(item, i % 2 === 0 ? 'a' : 'b'))}</View>
        <View style={{ width: circleSize, marginTop: circleSize / 2 }}>
          {rightColumn.map((item, i) => renderBubble(item, i % 2 === 0 ? 'b' : 'a'))}
        </View>
      </ScrollView>
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
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 24,
  },
});

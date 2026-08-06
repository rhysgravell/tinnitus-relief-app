import { Pressable, StyleSheet, Text } from 'react-native';
import { Mood } from '../store/moods';

type Props = {
  mood: Mood;
  size: number;
  tone: 'a' | 'b';
  isSelected: boolean;
  onPress: () => void;
};

export function MoodBubble({ mood, size, tone, isSelected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        tone === 'a' ? styles.toneA : styles.toneB,
        isSelected && styles.circleSelected,
      ]}
    >
      <Text style={styles.emoji}>{mood.emoji}</Text>
      <Text style={styles.label}>{mood.label}</Text>
    </Pressable>
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
  circleSelected: {
    borderColor: '#7eb8f7',
    borderWidth: 2,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  label: {
    color: '#e8f0fe',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

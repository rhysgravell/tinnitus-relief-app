import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BREATHING_PHASES, useBreathingCycle } from '../hooks/useBreathingCycle';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function BreathingExercise({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>{visible && <BreathingContent onClose={onClose} />}</View>
    </Modal>
  );
}

function BreathingContent({ onClose }: { onClose: () => void }) {
  const { phase, secondsRemaining } = useBreathingCycle(BREATHING_PHASES);
  const [scale] = useState(() => new Animated.Value(0.6));

  useEffect(() => {
    const target = phase.label === 'Breathe in' ? 1 : phase.label === 'Breathe out' ? 0.6 : null;
    if (target === null) return;

    Animated.timing(scale, {
      toValue: target,
      duration: phase.duration * 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [phase, scale]);

  return (
    <View style={styles.content}>
      <Animated.View style={[styles.circle, { transform: [{ scale }] }]} />
      <Text style={styles.phaseLabel}>{phase.label}</Text>
      <Text style={styles.countdown}>{secondsRemaining}</Text>
      <Pressable onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>Done</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 22, 40, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#1e3a5f',
    borderWidth: 2,
    borderColor: '#7eb8f7',
    marginBottom: 32,
  },
  phaseLabel: {
    color: '#e8f0fe',
    fontSize: 24,
    fontWeight: '600',
  },
  countdown: {
    color: '#7a8aa0',
    fontSize: 16,
    marginTop: 8,
  },
  closeButton: {
    marginTop: 48,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#111e35',
    borderWidth: 1,
    borderColor: '#1e2d4a',
  },
  closeButtonText: {
    color: '#7eb8f7',
    fontSize: 15,
    fontWeight: '600',
  },
});

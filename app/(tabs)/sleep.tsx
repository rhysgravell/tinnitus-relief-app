import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BreathingExercise } from '../../components/BreathingExercise';
import { SleepTipCard } from '../../components/SleepTipCard';
import { SLEEP_TIPS } from '../../store/sleepTips';

const BREATHING_TIP_ID = 'slow-breathing';

export default function SleepScreen() {
  const [breathingVisible, setBreathingVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Sleep</Text>
        <Text style={styles.subheading}>Wind down for the night</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {SLEEP_TIPS.map((tip) => (
          <SleepTipCard
            key={tip.id}
            tip={tip}
            onPress={tip.id === BREATHING_TIP_ID ? () => setBreathingVisible(true) : undefined}
          />
        ))}
      </ScrollView>
      <BreathingExercise visible={breathingVisible} onClose={() => setBreathingVisible(false)} />
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
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});

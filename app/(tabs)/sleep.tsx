import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SleepTipCard } from '../../components/SleepTipCard';
import { SLEEP_TIPS } from '../../store/sleepTips';

export default function SleepScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Sleep</Text>
        <Text style={styles.subheading}>Wind down for the night</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {SLEEP_TIPS.map((tip) => (
          <SleepTipCard key={tip.id} tip={tip} />
        ))}
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});

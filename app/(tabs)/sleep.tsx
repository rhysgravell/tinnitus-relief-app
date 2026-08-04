import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SleepScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Sleep</Text>
        <Text style={styles.subheading}>Wind down for the night</Text>
      </View>
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Coming soon.</Text>
        <Text style={styles.emptyHint}>Sleep tracking and routines will live here.</Text>
      </View>
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

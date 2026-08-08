import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SleepTip } from '../store/sleepTips';

type Props = {
  tip: SleepTip;
  onPress?: () => void;
};

export function SleepTipCard({ tip, onPress }: Props) {
  const content = (
    <>
      <Text style={styles.icon}>{tip.icon}</Text>
      <View style={styles.info}>
        <Text style={styles.title}>{tip.title}</Text>
        <Text style={styles.description}>{tip.description}</Text>
      </View>
      {onPress && <Text style={styles.chevron}>›</Text>}
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.card} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.card}>{content}</View>;
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
  icon: {
    fontSize: 28,
    marginRight: 14,
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
  chevron: {
    color: '#7eb8f7',
    fontSize: 22,
    marginLeft: 8,
  },
});

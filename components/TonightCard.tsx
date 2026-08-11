import { StyleSheet, View } from 'react-native';
import { Card } from './Card';
import { SecondaryButton } from './SecondaryButton';
import { SectionLabel } from './SectionLabel';
import { Text } from './Text';
import { Toggle } from './Toggle';
import { LAYOUT, SPACE } from '../theme/tokens';

type Props = {
  /** "22:30" — when the reminder is set for. */
  time: string;
  /** How long tonight's session will run, and what it will play. */
  summary: string;
  reminderOn: boolean;
  onReminderChange: (on: boolean) => void;
  /** Shown in place of the summary when the OS has refused notifications. */
  denied?: boolean;
  onStart: () => void;
};

/**
 * Tonight: when the wind-down is set for, what it will play, and a way to start it now
 * rather than waiting for the reminder.
 *
 * The reminder switch and the start button are deliberately separate: wanting a nudge at
 * 22:30 and wanting to begin this second are different things, and a card that conflated
 * them would make one of them impossible.
 */
export function TonightCard({
  time,
  summary,
  reminderOn,
  onReminderChange,
  denied = false,
  onStart,
}: Props) {
  return (
    <Card testID="tonight-card" variant="hero" padding={LAYOUT.cardPaddingLarge}>
      <View style={styles.top}>
        <View style={styles.details}>
          <SectionLabel tone="primary" style={styles.label}>
            Tonight
          </SectionLabel>
          <Text variant="cardTitleHero">{`Wind-down at ${time}`}</Text>
          <Text variant="bodySecondary" tone="muted" style={styles.summary}>
            {denied
              ? 'Notifications are off for this app, so there will be no reminder.'
              : summary}
          </Text>
        </View>
        <Toggle
          value={reminderOn}
          onValueChange={onReminderChange}
          accessibilityLabel={`Remind me at ${time}`}
        />
      </View>
      <SecondaryButton label="Start now" onPress={onStart} style={styles.start} />
    </Card>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACE.s16,
  },
  details: {
    // Lets the copy wrap rather than push the switch off the card.
    flex: 1,
  },
  label: {
    marginBottom: SPACE.s8,
  },
  summary: {
    marginTop: 5,
  },
  start: {
    marginTop: LAYOUT.cardPaddingLarge,
  },
});

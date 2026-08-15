import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Card } from './Card';
import { PlayTriangle } from './PlayTriangle';
import { SectionLabel } from './SectionLabel';
import { Text } from './Text';
import { useTheme } from '../theme/ThemeProvider';
import { SPACE } from '../theme/tokens';
import { relativeDayLabel } from '../utils/time';
import type { Sound } from '../store/sounds';
import type { Session } from '../store/sessions';

const ARTWORK_HEIGHT = 104;
const PLAY_SIZE = 54;

type Props = {
  sound: Sound;
  session: Session;
  onPress: () => void;
  /** Injectable so the "Last night" wording can be tested without freezing the clock. */
  now?: Date;
};

/**
 * The card at the top of Sounds. Most nights are a repeat of the night before, so the
 * screen leads with resuming rather than with browsing.
 *
 * The whole card is the target, not just the play circle — the circle is what makes the
 * card's purpose obvious, but a 54pt button inside a card people already want to tap
 * would be a needlessly small thing to aim at.
 */
export function ResumeCard({ sound, session, onPress, now = new Date() }: Props) {
  const { colors } = useTheme();

  const when = relativeDayLabel(new Date(session.endedAt), now);
  const timer = session.timerMinutes === null ? null : `timer ${session.timerMinutes}m`;
  const meta = [when, `${session.durationMinutes} min`, timer].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Continue ${sound.name}`}
      accessibilityHint={meta}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card testID="resume-card" variant="hero" padding={0} clip>
        <View style={[styles.artwork, { backgroundColor: colors.track }]}>
          <Image
            source={sound.artwork}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            accessible={false}
          />
        </View>
        <View style={styles.body}>
          <View style={styles.details}>
            <SectionLabel tone="primary" style={styles.label}>
              Continue
            </SectionLabel>
            <Text variant="cardTitleLarge" numberOfLines={1}>
              {sound.name}
            </Text>
            <Text variant="bodySecondary" tone="muted" style={styles.meta} numberOfLines={1}>
              {meta}
            </Text>
          </View>
          <View testID="resume-play" style={[styles.play, { backgroundColor: colors.primary }]}>
            <PlayTriangle size={16} color={colors.onPrimary} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  artwork: {
    height: ARTWORK_HEIGHT,
    position: 'relative',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.s14,
    paddingVertical: 15,
    paddingHorizontal: SPACE.s16,
  },
  details: {
    flex: 1,
    // Lets the name and meta lines truncate instead of pushing the play circle off the card.
    minWidth: 0,
  },
  label: {
    marginBottom: SPACE.s6,
  },
  meta: {
    marginTop: SPACE.s3,
  },
  play: {
    width: PLAY_SIZE,
    height: PLAY_SIZE,
    borderRadius: PLAY_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pressed: {
    opacity: 0.85,
  },
});

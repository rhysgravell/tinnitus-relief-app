import { StyleSheet, Text as RNText, View } from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { Text } from './Text';
import { useTheme } from '../theme/ThemeProvider';
import { LAYOUT, SPACE } from '../theme/tokens';

/** The dashed ring the glyph sits in, at the diameter the design gives it. */
const RING_SIZE = 80;

type Props = {
  /** A text character rather than an icon — this design ships no icon library. */
  glyph: string;
  title: string;
  body: string;
  /**
   * The way out. Optional, but an empty state that only explains itself is a dead end, so
   * pass one wherever there is somewhere to go.
   */
  action?: { label: string; onPress: () => void };
  testID?: string;
};

/**
 * A screen with nothing in it yet: a glyph in a dashed ring, a line saying so, a line
 * saying how to change it, and a button that does.
 *
 * The ring is dashed rather than filled because nothing is there yet — a solid circle
 * would read as a component that had failed to load.
 */
export function EmptyState({ glyph, title, body, action, testID }: Props) {
  const { colors } = useTheme();

  return (
    <View testID={testID} style={styles.container}>
      {/* A dashed border with a radius renders solid on some Android versions. It degrades
          to a plain ring there, which is a fair enough second best. */}
      <View style={[styles.ring, { borderColor: colors.borderStrong }]}>
        <RNText style={[styles.glyph, { color: colors.textSubtle }]}>{glyph}</RNText>
      </View>
      <Text variant="emptyTitle">{title}</Text>
      <Text tone="muted" style={styles.body}>
        {body}
      </Text>
      {action ? (
        <PrimaryButton
          label={action.label}
          onPress={action.onPress}
          inline
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.s14,
    paddingHorizontal: SPACE.s44,
  },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: LAYOUT.hairlineWidth,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontSize: 26,
    lineHeight: 26,
  },
  body: {
    textAlign: 'center',
  },
  action: {
    // The gap already separates it; the design gives the button a little more room than
    // the lines of copy get from each other.
    marginTop: SPACE.s8,
  },
});

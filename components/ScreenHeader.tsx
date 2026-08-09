import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import { Text } from './Text';
import { LAYOUT, SPACE } from '../theme/tokens';

type Props = {
  title: string;
  subtitle?: string;
  /**
   * The line above the title, used on Sounds for "Good evening, Rhys". It varies by time
   * of day, which is why the caller supplies it rather than the header deriving it.
   */
  greeting?: string;
  /** Trailing control, aligned to the top of the block — the Settings entry point. */
  action?: ReactNode;
  /**
   * Space below the block. Screens whose first element brings its own top padding pass 0
   * so the two do not stack into a gap twice the size.
   */
  paddingBottom?: number;
};

/**
 * The title block every tab screen opens with. Takes its colours from the active
 * provider, so the same component serves the light screens and the night ones.
 */
export function ScreenHeader({
  title,
  subtitle,
  greeting,
  action,
  paddingBottom = SPACE.s20,
}: Props) {
  return (
    <View
      testID="screen-header"
      style={[
        styles.header,
        // The greeting line's own leading makes up the difference, so a header that has
        // one starts 2pt higher and the titles still land in the same place.
        { paddingTop: greeting ? SPACE.s16 : SPACE.s18, paddingBottom },
      ]}
    >
      <View style={styles.titles}>
        {greeting ? (
          <Text variant="bodySecondary" tone="muted">
            {greeting}
          </Text>
        ) : null}
        <Text variant="screenTitle" role="heading" style={greeting ? styles.titleBelowGreeting : null}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="screenSubtitle" tone="muted" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACE.s16,
    paddingHorizontal: LAYOUT.screenGutter,
  },
  titles: {
    flex: 1,
  },
  titleBelowGreeting: {
    marginTop: SPACE.s2,
  },
  subtitle: {
    marginTop: SPACE.s2,
  },
});

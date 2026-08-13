import { Pressable, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import { Text } from './Text';
import { useTheme } from '../theme/ThemeProvider';
import { LAYOUT, SPACE } from '../theme/tokens';

/**
 * The row's insets, off the spacing scale as the design draws them. With the 21pt line
 * they put the row at 51pt, so a whole-row target clears the 44pt minimum on its own.
 */
const INSET_Y = 15;

type Props = {
  title: string;
  /** The plain-English line under anything that is not obvious from its title. */
  description?: string;
  /** The current value, on a row that opens a control: "45 min", "22:30", "Off". */
  value?: string;
  /** How to read the value out, where it is a 24 hour clock time or an abbreviation. */
  valueAccessibilityLabel?: string;
  /** A control that lives in the row itself — a switch, which brings its own label. */
  control?: ReactNode;
  /** Given on a row that opens something. The row is then a button. */
  onPress?: () => void;
  expanded?: boolean;
  /** What the row opens, shown underneath it while `expanded`. */
  children?: ReactNode;
  /** A hairline below the row. The last row of a group leaves it off. */
  divider?: boolean;
  testID?: string;
};

/**
 * One line of a settings card: what it is, optionally what it means, and the control or
 * value at the end of it.
 *
 * A row that opens a control keeps it in place rather than pushing a screen. Every choice
 * in this app is a handful of options wide, and a sheet for five pills would be a second
 * gesture for no more information.
 */
export function SettingsRow({
  title,
  description,
  value,
  valueAccessibilityLabel,
  control,
  onPress,
  expanded = false,
  children,
  divider = false,
  testID,
}: Props) {
  const { colors } = useTheme();

  const line = (
    <View testID="settings-row-line" style={styles.line}>
      <View style={styles.titles}>
        <Text variant="rowLabel">{title}</Text>
        {description ? (
          <Text variant="meta" tone="subtle" style={styles.description}>
            {description}
          </Text>
        ) : null}
      </View>

      {value !== undefined ? (
        <View style={styles.value}>
          <Text variant="body" tone="muted">
            {value}
          </Text>
          {/* This design ships no icon library, so the disclosure is the character the
              handoff draws: a chevron that turns down once the row is open. */}
          <Text variant="body" tone="muted">
            {expanded ? '⌄' : '›'}
          </Text>
        </View>
      ) : null}

      {control}
    </View>
  );

  return (
    <View
      testID={testID}
      style={divider ? [styles.divided, { borderBottomColor: colors.hairlineInner }] : null}
    >
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          // Named and valued explicitly: the row's own text would otherwise be read out
          // with the chevron on the end of it.
          accessibilityLabel={title}
          accessibilityValue={
            value === undefined ? undefined : { text: valueAccessibilityLabel ?? value }
          }
          accessibilityState={{ expanded }}
          style={({ pressed }) => (pressed ? styles.pressed : null)}
        >
          {line}
        </Pressable>
      ) : (
        line
      )}

      {/* Outside the pressable: a tap on the control it opened is not a tap on the row. */}
      {expanded ? <View style={styles.detail}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  divided: {
    borderBottomWidth: LAYOUT.hairlineWidth,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: LAYOUT.cardPadding,
    paddingVertical: INSET_Y,
    paddingHorizontal: LAYOUT.cardPadding,
  },
  titles: {
    // Shrinks rather than pushing the control off the row, so a description wraps.
    flexShrink: 1,
  },
  description: {
    marginTop: SPACE.s2,
  },
  value: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.s6,
  },
  detail: {
    paddingHorizontal: LAYOUT.cardPadding,
    paddingBottom: INSET_Y,
  },
  pressed: {
    opacity: 0.7,
  },
});

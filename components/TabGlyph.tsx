import { StyleSheet, Text as RNText, View } from 'react-native';
import { RADIUS } from '../theme/tokens';

/** The four tab glyphs, all geometric — there are no emoji anywhere in this app. */
export type TabGlyphName = 'circle' | 'star' | 'moon' | 'square';

const SIZE = 18;

type Props = {
  glyph: TabGlyphName;
  focused: boolean;
  color: string;
};

/**
 * A tab glyph. Two are shapes and two are text characters, which is why this is not an
 * icon set: no icon library ships a 5px-radius square that matches the Check-in card.
 */
export function TabGlyph({ glyph, focused, color }: Props) {
  if (glyph === 'star' || glyph === 'moon') {
    return (
      // Deliberately not the Text primitive: its families are DM Sans and Newsreader,
      // neither of which carries these characters, so this falls back to the system face.
      <RNText style={[styles.character, { color }]} accessible={false}>
        {glyph === 'moon' ? '☾' : focused ? '★' : '☆'}
      </RNText>
    );
  }

  return (
    <View
      testID={`tab-glyph-${glyph}`}
      style={[
        styles.shape,
        { borderRadius: glyph === 'circle' ? SIZE / 2 : RADIUS.tabSquare },
        // Filled when active, a 2px outline when not — the same weight either way, so the
        // row does not shift as you move between tabs.
        focused ? { backgroundColor: color } : { borderWidth: 2, borderColor: color },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  shape: {
    width: SIZE,
    height: SIZE,
  },
  character: {
    width: SIZE,
    height: SIZE,
    fontSize: 16,
    lineHeight: SIZE,
    textAlign: 'center',
  },
});

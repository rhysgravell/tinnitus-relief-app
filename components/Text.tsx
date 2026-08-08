import { Text as RNText } from 'react-native';
import type { TextProps as RNTextProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { TYPE } from '../theme/tokens';
import type { Palette } from '../theme/tokens';

/** A role from the type scale. Named `variant` as a prop so it doesn't shadow React
 * Native's own `role` prop, which sets the accessibility role. */
export type TextVariant = keyof typeof TYPE;

/** Which palette colour the text takes. `inherit` leaves colour to the caller. */
export type TextTone =
  | 'default'
  | 'muted'
  | 'faint'
  | 'subtle'
  | 'primary'
  | 'onPrimary'
  | 'inherit';

/** The palette keys that hold a plain colour, excluding the gradient tuple. */
type ColorKey = {
  [K in keyof Palette]: Palette[K] extends string ? K : never;
}[keyof Palette];

const TONE_COLORS: Record<Exclude<TextTone, 'inherit'>, ColorKey> = {
  default: 'text',
  muted: 'textMuted',
  faint: 'textFaint',
  subtle: 'textSubtle',
  primary: 'primary',
  onPrimary: 'onPrimary',
};

type Props = RNTextProps & {
  variant?: TextVariant;
  tone?: TextTone;
};

/**
 * The only text primitive screens should use. Takes a variant from the type scale and
 * a tone from the active palette, so no screen has to know a font family or a hex value.
 */
export function Text({ variant = 'body', tone = 'default', style, ...rest }: Props) {
  const { colors } = useTheme();
  const color = tone === 'inherit' ? undefined : colors[TONE_COLORS[tone]];

  return <RNText {...rest} style={[TYPE[variant], color ? { color } : null, style]} />;
}

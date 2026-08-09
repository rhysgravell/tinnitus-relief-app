import { Text } from './Text';
import type { TextTone } from './Text';
import type { TextProps } from 'react-native';

type Props = TextProps & {
  /** `large` is the 13px label used above the Sleep routine list. */
  size?: 'default' | 'large';
  tone?: TextTone;
};

/**
 * The mono, uppercase, letter-spaced label that heads a group — "TONIGHT", "PLAYBACK",
 * "CONTINUE". Casing comes from the type role, so callers pass ordinary copy and the
 * label renders uppercase without a second version of the string in the source.
 */
export function SectionLabel({ size = 'default', tone = 'subtle', ...rest }: Props) {
  return <Text {...rest} variant={size === 'large' ? 'sectionLabelLarge' : 'sectionLabel'} tone={tone} />;
}

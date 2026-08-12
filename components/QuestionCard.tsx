import { View } from 'react-native';
import type { ReactNode } from 'react';
import { Card } from './Card';
import { Text } from './Text';
import { SPACE } from '../theme/tokens';

type Props = {
  question: string;
  /**
   * Space between the question and the control. 14 by default, 12 under the mood chips,
   * whose own padding makes up the difference.
   */
  gap?: number;
  children: ReactNode;
  testID?: string;
};

/** A card that asks one thing and holds the control that answers it. */
export function QuestionCard({ question, gap = SPACE.s14, children, testID }: Props) {
  return (
    <Card testID={testID}>
      <Text variant="cardTitleSmall">{question}</Text>
      <View testID="question-control" style={{ marginTop: gap }}>
        {children}
      </View>
    </Card>
  );
}

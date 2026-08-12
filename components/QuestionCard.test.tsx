import { render, screen } from '@testing-library/react-native';
import { Text as RNText } from 'react-native';
import { StyleSheet } from 'react-native';
import { QuestionCard } from './QuestionCard';
import { ThemeProvider } from '../theme/ThemeProvider';
import { SPACE, TYPE } from '../theme/tokens';

function renderCard(gap?: number) {
  render(
    <ThemeProvider scheme="light">
      <QuestionCard testID="card" question="How loud was the ringing?" gap={gap}>
        <RNText>the control</RNText>
      </QuestionCard>
    </ThemeProvider>
  );
}

describe('QuestionCard', () => {
  it('asks its question above the control it holds', () => {
    renderCard();
    expect(screen.getByText('How loud was the ringing?')).toBeTruthy();
    expect(screen.getByText('the control')).toBeTruthy();
  });

  it('sets the question in the small card title', () => {
    renderCard();
    expect(
      StyleSheet.flatten(screen.getByText('How loud was the ringing?').props.style)
    ).toMatchObject(TYPE.cardTitleSmall);
  });

  it('separates the two by the gap it is given', () => {
    renderCard(SPACE.s12);
    expect(
      StyleSheet.flatten(screen.getByTestId('question-control').props.style).marginTop
    ).toBe(SPACE.s12);
  });
});

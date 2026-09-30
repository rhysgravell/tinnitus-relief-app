import { render, screen } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';
import { RoutineStep } from './RoutineStep';
import { ThemeProvider } from '../theme/ThemeProvider';
import { COLORS } from '../theme/tokens';
import { ROUTINE } from '../store/routine';

const step = ROUTINE[0];

function renderStep(props: Partial<Parameters<typeof RoutineStep>[0]> = {}) {
  render(
    <ThemeProvider scheme="dark">
      <RoutineStep step={step} position={1} {...props} />
    </ThemeProvider>
  );
}

function row() {
  return screen.getByTestId(`routine-step-${step.id}`);
}

function breathingStep() {
  const found = ROUTINE.find((entry) => entry.action === 'breathing');
  if (!found) throw new Error('the routine has no breathing step');
  return found;
}

describe('RoutineStep', () => {
  it('gives the instruction and the reason for it', () => {
    renderStep();
    expect(screen.getByText(step.title)).toBeTruthy();
    expect(screen.getByText(step.detail)).toBeTruthy();
  });

  it('speaks an abbreviated title in words, while showing the abbreviation the design draws', () => {
    const breathing = breathingStep();
    renderStep({ step: breathing });
    expect(screen.getByLabelText('Slow breathing, 4 minutes')).toBeTruthy();
    expect(screen.getByText(breathing.title)).toBeTruthy();
  });

  it('lets a title that needs no spoken variant be read as it is written', () => {
    // Three of the four steps are whole words already; a label of their own would only be
    // a second copy to drift.
    renderStep();
    expect(screen.getByText(step.title).props.accessibilityLabel).toBeUndefined();
  });

  it('numbers the step rather than illustrating it', () => {
    // The old screen used an emoji per tip; a numeral says this is a sequence.
    renderStep({ position: 3 });
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('separates itself from the step below with a hairline', () => {
    renderStep();
    const style = StyleSheet.flatten(row().props.style);
    expect(style.borderBottomWidth).toBe(1);
    expect(style.borderBottomColor).toBe(COLORS.dark.hairline);
  });

  it('drops the line under the last step, where it would read as a missing row', () => {
    renderStep({ divider: false });
    expect(StyleSheet.flatten(row().props.style).borderBottomWidth).toBeUndefined();
  });

  it('shows the control of a step that has one', () => {
    renderStep({ action: <Text>Start</Text> });
    expect(screen.getByText('Start')).toBeTruthy();
  });

  it('centres a step with a control so the number lines up with it', () => {
    renderStep({ action: <Text>Start</Text> });
    expect(StyleSheet.flatten(row().props.style).alignItems).toBe('center');
  });

  it('keeps the number with the first line of text when there is no control', () => {
    renderStep();
    expect(StyleSheet.flatten(row().props.style).alignItems).toBe('flex-start');
  });
});

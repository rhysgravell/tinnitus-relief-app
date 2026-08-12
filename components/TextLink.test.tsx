import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { TextLink } from './TextLink';
import { ThemeProvider } from '../theme/ThemeProvider';
import { COLORS, TYPE } from '../theme/tokens';

const onPress = jest.fn();

function renderLink(props: Partial<Parameters<typeof TextLink>[0]> = {}) {
  render(
    <ThemeProvider scheme="light">
      <TextLink label="See more" onPress={onPress} {...props} />
    </ThemeProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TextLink', () => {
  it('is a button with its label spoken', () => {
    renderLink();
    expect(screen.getByRole('button', { name: 'See more' })).toBeTruthy();
  });

  it('fires when pressed', () => {
    renderLink();
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalled();
  });

  it('takes a fuller spoken name where the label is too terse', () => {
    renderLink({ accessibilityLabel: 'Show the last 30 days' });
    expect(screen.getByRole('button', { name: 'Show the last 30 days' })).toBeTruthy();
  });

  it('reads as the accent rather than as body copy', () => {
    renderLink();
    const style = StyleSheet.flatten(screen.getByText('See more').props.style);
    expect(style.color).toBe(COLORS.light.primary);
    expect(style).toMatchObject(TYPE.bodySecondary);
  });

  it('grows its tap area past the height of the word', () => {
    renderLink();
    expect(screen.getByRole('button').props.hitSlop).toMatchObject({ top: 12, bottom: 12 });
  });
});

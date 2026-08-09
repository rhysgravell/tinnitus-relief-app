import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { TabGlyph } from './TabGlyph';
import { COLORS, RADIUS } from '../theme/tokens';

const ACTIVE = COLORS.light.primary;
const INACTIVE = COLORS.light.textSubtle;

function shapeStyle(glyph: 'circle' | 'square') {
  return StyleSheet.flatten(screen.getByTestId(`tab-glyph-${glyph}`).props.style);
}

describe('TabGlyph', () => {
  it('fills the shape when the tab is active', () => {
    render(<TabGlyph glyph="circle" focused color={ACTIVE} />);
    const style = shapeStyle('circle');
    expect(style.backgroundColor).toBe(ACTIVE);
    expect(style.borderWidth).toBeUndefined();
  });

  it('outlines the shape when the tab is not active', () => {
    render(<TabGlyph glyph="circle" focused={false} color={INACTIVE} />);
    const style = shapeStyle('circle');
    expect(style).toMatchObject({ borderWidth: 2, borderColor: INACTIVE });
    expect(style.backgroundColor).toBeUndefined();
  });

  it('rounds the Sounds glyph into a circle', () => {
    render(<TabGlyph glyph="circle" focused color={ACTIVE} />);
    expect(shapeStyle('circle')).toMatchObject({ width: 18, height: 18, borderRadius: 9 });
  });

  it('gives the Check-in glyph the rounded-square radius', () => {
    // 5px, the same radius as the Check-in card it stands for.
    render(<TabGlyph glyph="square" focused={false} color={INACTIVE} />);
    expect(shapeStyle('square').borderRadius).toBe(RADIUS.tabSquare);
  });

  it('fills in the star when Saved is active', () => {
    render(<TabGlyph glyph="star" focused color={ACTIVE} />);
    expect(screen.getByText('★')).toBeTruthy();
  });

  it('hollows the star out when Saved is not active', () => {
    render(<TabGlyph glyph="star" focused={false} color={INACTIVE} />);
    expect(screen.getByText('☆')).toBeTruthy();
  });

  it('only tints the moon, since a crescent has no hollow form', () => {
    render(<TabGlyph glyph="moon" focused color={ACTIVE} />);
    expect(StyleSheet.flatten(screen.getByText('☾').props.style).color).toBe(ACTIVE);
  });

  it('uses no emoji', () => {
    // The previous build's emoji rendered inconsistently across OS versions. Every glyph
    // here is a shape or a plain text character.
    render(
      <>
        <TabGlyph glyph="star" focused color={ACTIVE} />
        <TabGlyph glyph="moon" focused={false} color={INACTIVE} />
      </>
    );
    for (const character of ['★', '☾']) {
      expect(screen.getByText(character)).toBeTruthy();
      expect(character).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it('keeps every glyph in the same 18pt box so the row does not shift', () => {
    render(<TabGlyph glyph="moon" focused={false} color={INACTIVE} />);
    expect(StyleSheet.flatten(screen.getByText('☾').props.style)).toMatchObject({
      width: 18,
      height: 18,
    });
  });
});

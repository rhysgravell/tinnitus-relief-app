import { useWindowDimensions } from 'react-native';

export const GRID_PADDING = 20;
export const COLUMN_GAP = 16;

export function useBubbleGrid<T>(items: T[]) {
  const { width } = useWindowDimensions();
  const circleSize = (width - GRID_PADDING * 2 - COLUMN_GAP) / 2;
  const leftColumn = items.filter((_, i) => i % 2 === 0);
  const rightColumn = items.filter((_, i) => i % 2 === 1);
  return { circleSize, leftColumn, rightColumn };
}

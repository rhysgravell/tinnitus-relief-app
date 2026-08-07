import { useWindowDimensions } from 'react-native';

export const GRID_PADDING = 20;
export const COLUMN_GAP = 16;
export const GRID_BOTTOM_PADDING = 24;

export function useBubbleGrid<T>(items: T[], availableHeight?: number) {
  const { width } = useWindowDimensions();
  const widthBasedSize = (width - GRID_PADDING * 2 - COLUMN_GAP) / 2;

  const leftColumn = items.filter((_, i) => i % 2 === 0);
  const rightColumn = items.filter((_, i) => i % 2 === 1);
  const rows = Math.max(leftColumn.length, rightColumn.length);

  // The offset column is staggered by half a circle, so its total height is
  // (rows + 0.5) circles plus a gap between each row.
  let circleSize = widthBasedSize;
  if (availableHeight && rows > 0) {
    const heightBasedSize = (availableHeight - GRID_BOTTOM_PADDING - rows * COLUMN_GAP) / (rows + 0.5);
    if (heightBasedSize > 0) {
      circleSize = Math.min(widthBasedSize, heightBasedSize);
    }
  }

  return { circleSize, leftColumn, rightColumn };
}

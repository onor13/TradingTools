/**
 * Shared utility functions for candle calculations
 */

export interface CandleData {
  open: number;
  close: number;
  low: number;
  high: number;
  direction?: string;
}

/**
 * Calculate the price range from a set of candles
 * @param candles Array of candle data
 * @returns Object containing minPrice, maxPrice, and priceRange
 */
export function calculateCandlePriceRange(candles: CandleData[]): {
  minPrice: number;
  maxPrice: number;
  priceRange: number;
} | null {
  if (!candles || candles.length === 0) {
    return null;
  }

  let minPrice = Infinity;
  let maxPrice = -Infinity;

  for (const candle of candles) {
    if (candle.low < minPrice) {
      minPrice = candle.low;
    }
    if (candle.high > maxPrice) {
      maxPrice = candle.high;
    }
  }

  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1; // 10% padding on both sides
  minPrice -= padding;
  maxPrice += padding;

  return { minPrice, maxPrice, priceRange };
}

/**
 * Calculate candle layout dimensions
 * @param width Canvas/SVG width
 * @param totalCandles Number of candles
 * @returns Object containing baseChartWidth, candleWidth, and candleSpacing
 */
export function calculateCandleLayout(
  width: number,
  totalCandles: number
): {
  baseChartWidth: number;
  candleWidth: number;
  candleSpacing: number;
} | null {
  if (totalCandles === 0) {
    return null;
  }

  const baseChartWidth = width - 40;
  const candleWidth = Math.max(2, baseChartWidth / totalCandles - 4);
  const candleSpacing = (baseChartWidth - candleWidth * totalCandles) / (totalCandles + 1);

  return { baseChartWidth, candleWidth, candleSpacing };
}

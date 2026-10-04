---
name: drag-high-low-features
description: Documentation for Drag High and Drag Low features in secondChart
metadata:
  type: project
---

## Drag High and Drag Low Features (secondChart)

**Location:** `CandlesVisualizer/src/app/components/candle-chart/candle-chart.component.ts`

### Overview
Interactive drag features on the second chart (editable chart) that allow users to modify candle high and low values by clicking and dragging on the wicks.

### How It Works
- **Drag High**: Click on the top half of a candle's wick and drag up/down to adjust the high value
- **Drag Low**: Click on the bottom half of a candle's wick and drag up/down to adjust the low value

### Implementation Details
- **Detection** (`onMouseDown`, line 277): Determines drag type based on click position
  ```typescript
  const isHigh = y <= (yHigh + yOpen) / 2; // true = high drag, false = low drag
  ```

- **Indicator Drawing** (`drawCursorIndicator`, lines 296-348):
  - **High drag**: Draws upward-pointing triangle + "Drag High" label at top of wick
  - **Low drag**: Draws downward-pointing triangle + "Drag Low" label at bottom of wick
  - Horizontal line shows current drag level across entire canvas

- **Price Calculation** (`onMouseMove`, lines 404-410):
  - High: Lower Y position = higher price (`newPrice = maxPrice - normalizedY * range`)
  - Low: Higher Y position = lower price (`newPrice = minPrice + normalizedY * range`)

- **Constraints** (lines 420-431):
  - High must be >= close price: `candle.high = Math.max(candle.close, newPrice)`
  - Low must be <= open price: `candle.low = Math.min(candle.open, newPrice)`
  - Ensures low never exceeds high

### Bug Fix (Oct 4, 2025)
**Issue**: Drag Low feature not working - bottom wick disappeared when attempting to drag.

**Root Cause**: 
1. `drawCursorIndicator` didn't clear canvas before drawing, causing indicator accumulation
2. `clearCursorIndicator` only cleared top portion of canvas (100px), missing low indicators drawn at bottom

**Fix**: 
- `drawCursorIndicator`: Added `ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)` before drawing
- `clearCursorIndicator`: Changed to clear entire canvas height instead of fixed 100px area

### Related Files
- `CandlesVisualizer/src/app/components/candle-chart/candle-chart.component.ts` - Main implementation
- `CandlesVisualizer/src/app/components/candle-chart/candle-chart.component.html` - Canvas template
- `CandlesVisualizer/src/app/app.component.html` - Second chart usage (line 28)

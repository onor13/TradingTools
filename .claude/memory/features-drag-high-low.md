---
name: drag-high-low-features
description: Documentation for Drag High and Drag Low features in secondChart
metadata:
  type: project
---

## Drag High and Drag Low Features (Editable Chart)

**Location:** `CandlesVisualizer/src/app/components/editable-chart/editable-chart.component.ts`

### Overview
Interactive drag features on the editable chart that allow users to modify candle high and low values by clicking and dragging on the wicks. This feature is implemented using Angular CDK Drag-Drop library.

### How It Works
- **Drag High**: Click on the top half of a candle's wick and drag up/down to adjust the high value
- **Drag Low**: Click on the bottom half of a candle's wick and drag up/down to adjust the low value

### Implementation Details
- Uses Angular CDK Drag-Drop (`CdkDrag`, `CdkDropList`) for smooth drag interactions
- **Detection** (`ngOnChanges`): Re-renders chart when candles change for editable charts
- **Indicator Drawing**: Canvas-based cursor indicators show drag state
  - **High drag**: Draws upward-pointing triangle + "Drag High" label at top of wick
  - **Low drag**: Draws downward-pointing triangle + "Drag Low" label at bottom of wick
  - Horizontal line shows current drag level across entire canvas

- **Price Calculation** (`renderChart`):
  - High: Lower Y position = higher price (`newPrice = maxPrice - normalizedY * range`)
  - Low: Higher Y position = lower price (`newPrice = minPrice + normalizedY * range`)

- **Constraints**:
  - High must be >= close price: `candle.high = Math.max(candle.close, newPrice)`
  - Low must be <= open price: `candle.low = Math.min(candle.open, newPrice)`
  - Ensures low never exceeds high

### Related Files
- `CandlesVisualizer/src/app/components/editable-chart/editable-chart.component.ts` - Main implementation
- `CandlesVisualizer/src/app/components/editable-chart/editable-chart.component.html` - Canvas template
- `CandlesVisualizer/src/app/components/data-chart/data-chart.component.ts` - Read-only chart (no drag features)
- `CandlesVisualizer/src/app/app.component.html` - Component usage

### Migration Notes (Oct 18, 2026)
The candle chart was refactored from a single shared component into two separate components:
- `app-data-chart`: Read-only chart for displaying data
- `app-editable-chart`: Editable chart with drag-drop functionality

The old `candle-chart` component has been deprecated and removed.

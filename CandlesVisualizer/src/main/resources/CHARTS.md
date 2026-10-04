# Candles Visualizer - Chart Documentation

## Overview

This module contains two candlestick charts:

### 1. `dataChart` (Primary Chart)
- **Location**: `app.component.html` - First `<app-candle-chart>` component
- **Purpose**: Displays actual candle data from the backend API
- **Data Source**: Bound to `candles` array (populated via `/api/candles` endpoint)
- **Behavior**: Renders candlesticks with open, close, high, low values

### 2. `secondChart` (Empty Chart)
- **Location**: `app.component.html` - Second `<app-candle-chart>` component (below dataChart)
- **Purpose**: Empty placeholder chart for future use or reference
- **Data Source**: Bound to empty array `[]` (no data)
- **Behavior**: Renders as an empty canvas with dashed border and light gray background

## Component Structure

```
app.component.html
├── dataChart (candles: populated)
│   └── <app-candle-chart [candles]="candles"></app-candle-chart>
└── secondChart (candles: empty)
    └── <app-candle-chart [candles]="[]"></app-candle-chart>
```

## Reference Guide

When referencing charts in future work:

- **dataChart** = the chart with actual candle data (top)
- **secondChart** = the empty placeholder chart (bottom)

Both charts use the same `app-candle-chart` component but with different data bindings.

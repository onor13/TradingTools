# Candles Visualizer - Chart Documentation

## Overview

This module contains two separate candlestick chart components:

### 1. `dataChart` (Read-only Chart)
- **Location**: `app.component.html` - First `<app-data-chart>` component
- **Purpose**: Displays actual candle data from the backend API
- **Data Source**: Bound to `candles` array (populated via `/api/candles` endpoint)
- **Behavior**: Renders candlesticks with open, close, high, low values
- **Component**: `app-data-chart` (800px × 400px canvas)

### 2. `editableChart` (Editable Chart)
- **Location**: `app.component.html` - Second `<app-editable-chart>` component (below dataChart)
- **Purpose**: Displays transferred candle data with interactive editing capabilities
- **Data Source**: Bound to `transferredCandles` array (populated via "Transfer Data" button)
- **Behavior**: 
  - Renders candlesticks with open, close, high, low values
  - Allows users to click and drag on candle wicks to modify high/low prices
  - Emits `candleModified` events when candles are edited
- **Component**: `app-editable-chart` (1920px × 600px canvas)

## Component Structure

```
src/app/components/
├── data-chart/
│   ├── data-chart.component.ts      # Read-only chart component
│   ├── data-chart.component.html    # Template
│   └── data-chart.component.css     # Styles
├── editable-chart/
│   ├── editable-chart.component.ts  # Editable chart with CDK drag-drop
│   ├── editable-chart.component.html # Template
│   └── editable-chart.component.css # Styles
└── candle-chart/                    # Legacy (deprecated)
```

## Reference Guide

When referencing charts in future work:

- **dataChart** = the read-only chart with actual candle data (top)
- **editableChart** = the editable chart for data manipulation (bottom)

The two charts use separate components optimized for their specific use cases:
- `app-data-chart`: Simple, lightweight display of candle data
- `app-editable-chart`: Full-featured with CDK drag-drop for interactive editing

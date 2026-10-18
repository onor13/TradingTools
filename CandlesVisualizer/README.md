# Candles Visualizer - Angular Frontend

A Spring Boot backend with an Angular frontend for visualizing candlestick charts.

## Project Structure

```
CandlesVisualizer/
├── src/
│   ├── main/java/org/onor/
│   │   ├── Main.java              # Spring Boot application entry point
│   │   ├── MyController.java      # REST API controller
│   │   └── PatternsToDisplay.java # Candle data generation
│   ├── main/resources/            # Static resources
│   └── test/                      # Test files
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── data-chart/         # Read-only candlestick chart component
│   │   │   ├── editable-chart/     # Editable candlestick chart with drag-drop
│   │   │   └── candle-chart/       # Legacy (deprecated)
│   │   ├── services/
│   │   │   └── candles-data.service.ts  # API service
│   │   ├── app.component.*        # Main application component
│   │   └── app.module.ts          # Root module
│   ├── index.html                 # HTML template
│   └── styles.css                 # Global styles
├── angular.json                   # Angular CLI configuration
├── package.json                   # Node.js dependencies
└── tsconfig*.json                 # TypeScript configurations
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/candles` | Get candle data |
| GET | `/api/basic` | Get basic candle patterns |
| POST | `/api/generate` | Generate candles with quantity |

## Running the Application

### Prerequisites
- Java 25+
- Node.js 18+ (for Angular development)

### Build and Run Backend

```bash
cd CandlesVisualizer
./gradlew bootRun
```

The backend will start on `http://localhost:8080`

### Run Angular Frontend (requires Node.js)

```bash
cd CandlesVisualizer
npm install
npx ng serve --port 4200
```

The frontend will be available at `http://localhost:4200`

## Features

- **Candlestick Chart Visualization**: Displays OHLC (Open, High, Low, Close) data
- **Interactive Grid**: Price labels and grid lines for easy reading
- **Color Coding**: Green candles for upward movement, red for downward
- **Responsive Design**: Adapts to different screen sizes
- **Refresh Button**: Reload candle data
- **Transfer Data Button**: Transfer candle data from the read-only chart to an editable chart

## Component Architecture

The application uses two separate chart components:

### `app-data-chart` (Read-only)
- Displays candlestick charts with OHLC data
- Shows price labels and grid lines
- Green candles for upward movement, red for downward
- Fixed width: 800px × 400px
- No interactive editing capabilities

### `app-editable-chart` (Editable)
- Same visualization as data-chart but with drag-drop functionality
- Allows users to click and drag on candle wicks to modify high/low values
- Wider canvas: 1920px × 600px for better editing experience
- Uses Angular CDK Drag-Drop library for smooth interactions
- Emits `candleModified` events when candles are edited

## Data Transfer Feature

The application includes a "Transfer Data" button that allows you to move candle data from the read-only chart to an editable chart. This is useful for:

- **Comparison**: View the same data in two separate charts
- **Analysis**: Copy data to an editable chart for further manipulation or testing
- **Demonstration**: Show how the chart renders with different data sets and editing capabilities

**How to use:**
1. Load candle data (automatic on page load or click "Refresh")
2. Click the "Transfer Data" button located between the two charts
3. The editable chart will populate with the same candle data
4. Click and drag on candle wicks in the editable chart to modify high/low values

## Technologies Used

### Backend
- Spring Boot 4.1.1
- Java 25

### Frontend
- Angular 21
- TypeScript 5.9
- Canvas API for chart rendering
- Angular CDK Drag-Drop for interactive editing

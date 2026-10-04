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
│   │   │   └── candle-chart/      # Candlestick chart component
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
- **Transfer Data Button**: Transfer candle data from the dataChart to a secondChart for comparison or analysis

## Technologies Used

### Backend
- Spring Boot 4.1.1
- Java 25

### Frontend
- Angular 18
- TypeScript 5.4
- Canvas API for chart rendering

## Data Transfer Feature

The application includes a "Transfer Data" button that allows you to move candle data from the first chart (displaying loaded data) to a second empty chart. This is useful for:

- **Comparison**: View the same data in two separate charts
- **Analysis**: Copy data to a blank chart for further manipulation or testing
- **Demonstration**: Show how the chart renders with different data sets

**How to use:**
1. Load candle data (automatic on page load or click "Refresh")
2. Click the "Transfer Data" button located between the two charts
3. The second chart will populate with the same candle data

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

## Technologies Used

### Backend
- Spring Boot 4.1.1
- Java 25

### Frontend
- Angular 18
- TypeScript 5.4
- Canvas API for chart rendering

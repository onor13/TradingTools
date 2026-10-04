import { Component, OnInit } from '@angular/core';
import { CandlesDataService, CandleData } from './services/candles-data.service';

export interface CandlesResponse {
  candles: CandleData[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Candles Visualizer';
  candles: CandleData[] = [];
  isLoading = true;
  error: string | null = null;
  minPrice!: number;
  maxPrice!: number;

  // Shared data for the second chart
  transferredCandles: CandleData[] = [];

  constructor(private candlesService: CandlesDataService) {}

  ngOnInit(): void {
    this.loadCandles();
  }

  loadCandles(): void {
    this.isLoading = true;
    this.error = null;

    this.candlesService.getCandles()
      .subscribe({
        next: (response) => {
          this.candles = response.candles || [];
          this.calculatePriceRange();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading candles:', err);
          this.error = 'Failed to load candle data. Please check the backend API.';
          this.isLoading = false;
        }
      });
  }

  refresh(): void {
    this.loadCandles();
  }

  transferData(): void {
    // Transfer candles data to the second chart via shared property
    if (this.candles.length > 0) {
      console.log('Transferring', this.candles.length, 'candles to second chart');
      // Create a deep copy of candles array with independent candle objects
      this.transferredCandles = this.candles.map(candle => ({
        open: candle.open,
        close: candle.close,
        low: candle.low,
        high: candle.high,
        direction: candle.direction
      }));
    } else {
      console.log('No data to transfer');
    }
  }

  onCandleModified(candle: CandleData): void {
    // Find the index of the modified candle in transferredCandles
    const index = this.transferredCandles.findIndex(c => c === candle || c.high === candle.high && c.low === candle.low);

    if (index !== -1) {
      // Update the transferredCandles array with modified values
      this.transferredCandles[index] = { ...this.transferredCandles[index], ...candle };
      console.log('Candle modified in second chart:', candle);
    }
  }

  calculatePriceRange(): void {
    if (this.candles.length === 0) return;

    let minPrice = Infinity;
    let maxPrice = -Infinity;

    for (const candle of this.candles) {
      if (candle.low < minPrice) minPrice = candle.low;
      if (candle.high > maxPrice) maxPrice = candle.high;
    }

    this.minPrice = minPrice;
    this.maxPrice = maxPrice;
  }
}

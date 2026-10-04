import { Component, OnInit, ViewChild } from '@angular/core';
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
      // Update the transferredCandles property which is bound to the second chart
      this.transferredCandles = [...this.candles];
    } else {
      console.log('No data to transfer');
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

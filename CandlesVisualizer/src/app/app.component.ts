import { Component, OnInit, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { DragDropModule, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { CandlesDataService, CandleData } from './services';
import { DataChartComponent } from './components/data-chart';
import { EditableChartComponent } from './components/editable-chart';

export interface CandlesResponse {
  candles: CandleData[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [CommonModule, HttpClientModule, DragDropModule, CdkDrag, CdkDropList, DataChartComponent, EditableChartComponent]
})
export class AppComponent implements OnInit {
  title = 'Candles Visualizer';
  candles: CandleData[] = [];
  isLoading = true;
  error: string | null = null;
  minPrice!: number;
  maxPrice!: number;

  // Shared data for the second chart - direct property binding
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
      console.log('=== TRANSFER DATA BUTTON CLICKED ===');
      console.log('Transferring', this.candles.length, 'candles to second chart');

      // Create a deep copy of candles array with independent candle objects
      const newCandles = this.candles.map(candle => ({
        open: candle.open,
        close: candle.close,
        low: candle.low,
        high: candle.high,
        direction: candle.direction
      }));

      console.log('Created new candles array with', newCandles.length, 'items');

      // Set the transferred candles directly - this triggers ngOnChanges in child component
      this.transferredCandles = newCandles;

    } else {
      console.log('No data to transfer');
    }
  }

  onCandleModified(candle: CandleData): void {
    console.log('onCandleModified called with:', candle);

    // Find the index of the modified candle in transferredCandles
    const index = this.transferredCandles.findIndex(c => c === candle || c.high === candle.high && c.low === candle.low);

    if (index !== -1) {
      // Update the transferredCandles array with modified values
      this.transferredCandles[index] = { ...this.transferredCandles[index], ...candle };
      console.log('Updated transferredCandles at index', index, ':', this.transferredCandles[index]);
      console.log('transferredCandles after update:', this.transferredCandles);
    } else {
      console.warn('Could not find candle in transferredCandles:', candle);
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

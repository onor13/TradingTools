import { Component, OnInit, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CandlesDataService, CandleData } from './services';
import { DataChartComponent } from './components/data-chart';
import { EditableChartComponent } from './components/editable-chart';

// TypeScript interface matching the Java CandleJson class
export interface CandleJson {
  open: number;
  close: number;
  low: number;
  high: number;
}

export interface CandlesResponse {
  candles: CandleData[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, DataChartComponent, EditableChartComponent]
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

  // Save As settings
  saveFileName = 'candles.json';
  saveMessage = 'Click "Save As" to choose where to save the file.';

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
          console.log('Loaded candles:', response.candles?.length || 0);
          this.candles = response.candles || [];
          if (this.candles.length > 0) {
            this.calculatePriceRange();
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading candles:', err);
          this.error = 'Failed to load candle data from API. Using mock data.';
          // Use mock data as fallback
          const mockCandles: CandleData[] = [
            { open: 510.0, close: 500.0, low: 480.0, high: 515.0, direction: 'DOWN' }
          ];
          this.candles = mockCandles;
          this.calculatePriceRange();
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

  saveAs(): void {
    console.log('=== SAVE AS BUTTON CLICKED ===');
    console.log('Saving chart data...');

    // Validate file name
    if (!this.saveFileName.trim()) {
      alert('Please enter a file name');
      return;
    }

    // Create a list of CandleJson objects based on the editableChart data
    const candleJsonList: CandleJson[] = this.transferredCandles.map(candle => ({
      open: candle.open,
      close: candle.close,
      low: candle.low,
      high: candle.high
    }));

    console.log('Created CandleJson list with', candleJsonList.length, 'items');
    console.log('CandleJson list:', candleJsonList);

    // Try to use native file save dialog (File System Access API)
    this.saveToJsonFile(candleJsonList, this.saveFileName);
  }

  private async saveToJsonFile(data: CandleJson[], fileName: string): Promise<void> {
    // Convert CandleJson objects to plain objects for JSON serialization
    const jsonData = JSON.stringify(data, null, 2);

    // Create a Blob with the JSON data
    const blob = new Blob([jsonData], { type: 'application/json' });

    this.downloadToJsonFile(blob, fileName);

  }

  private downloadToJsonFile(blob: Blob, fileName: string): void {
    // Create a temporary download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('File downloaded:', fileName);
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

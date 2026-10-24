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

  showFileNameDialog(): void {
    console.log('=== SAVE AS BUTTON CLICKED ===');
    console.log('Opening file name input dialog...');

    // Show the input dialog synchronously for Safari's user-activation policy
    const dialogElement = document.getElementById('fileNameDialog');
    if (dialogElement) {
      dialogElement.style.display = 'flex';

      // Focus the input field and select all text for easy replacement
      const inputElement = document.getElementById('fileNameInput') as HTMLInputElement;
      if (inputElement) {
        inputElement.value = this.saveFileName || '';
        inputElement.focus();
        inputElement.select();

        // Trigger the save when user presses Enter or clicks Confirm
        inputElement.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === 'Enter') {
            this.confirmSave();
          }
        });
      }
    }
  }

  confirmSave(): void {
    const dialogElement = document.getElementById('fileNameDialog');
    const inputElement = document.getElementById('fileNameInput') as HTMLInputElement;

    if (dialogElement && inputElement) {
      const fileName = inputElement.value.trim();

      // Hide the dialog
      dialogElement.style.display = 'none';

      // Validate file name
      if (!fileName) {
        console.log('No file name provided, hiding dialog');
        dialogElement.style.display = 'flex';
        inputElement.focus();
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
      console.log('Saving file:', fileName);

      // Save the JSON file
      this.saveToJsonFile(candleJsonList, fileName);

      // Also capture and save a screenshot of the chart
      this.captureChartScreenshot().then((screenshotBlob) => {
        if (screenshotBlob) {
          // Generate PNG filename with .png extension
          const pngFileName = fileName.replace('.json', '.png');
          console.log('Captured chart screenshot, saving as:', pngFileName);
          this.downloadImageFile(screenshotBlob, pngFileName);
        }
      }).catch((error) => {
        console.error('Error capturing chart screenshot:', error);
      });
    }
  }

  hideFileNameDialog(): void {
    const dialogElement = document.getElementById('fileNameDialog');
    if (dialogElement) {
      dialogElement.style.display = 'none';
    }
  }

  saveAs(): void {
    // Show the file name input dialog synchronously
    this.showFileNameDialog();
  }

  private async saveToJsonFile(data: CandleJson[], fileName: string): Promise<void> {
    // Convert CandleJson objects to plain objects for JSON serialization
    const jsonData = JSON.stringify(data, null, 2);

    // Create a Blob with the JSON data
    const blob = new Blob([jsonData], { type: 'application/json' });

    this.downloadToJsonFile(blob, fileName);

  }

  private async captureChartScreenshot(): Promise<Blob | null> {
    // Get reference to the editable chart SVG element
    const chartElement = document.getElementById('editable-chart') as HTMLElement;

    if (!chartElement) {
      console.warn('Editable chart element not found');
      return null;
    }

    const svgElement = chartElement.querySelector('svg') as SVGSVGElement;
    if (!svgElement) {
      console.warn('SVG element not found within editable chart');
      return null;
    }

    // Get the SVG dimensions
    const width = svgElement.clientWidth || 1920;
    const height = svgElement.clientHeight || 600;

    // Create a canvas to convert SVG to image
    const canvas = document.createElement('canvas');
    canvas.width = width * 2; // 2x resolution for better quality
    canvas.height = height * 2;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Could not get canvas context');
      return null;
    }

    // Serialize SVG to string
    const svgData = new XMLSerializer().serializeToString(svgElement);

    // Create SVG blob URL
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    // Create image element and load SVG
    const img = new Image();
    return new Promise<Blob | null>((resolve) => {
      img.onload = () => {
        // Clear canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw SVG at 2x scale
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to PNG
        const pngUrl = canvas.toDataURL('image/png', 1.0);
        URL.revokeObjectURL(url);

        // Convert PNG data URL to blob
        const base64Data = pngUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteArrays = [];

        for (let i = 0; i < byteCharacters.length; i++) {
          byteArrays.push(byteCharacters.charCodeAt(i));
        }

        const byteArray = new Uint8Array(byteArrays);
        const pngBlob = new Blob([byteArray], { type: 'image/png' });
        resolve(pngBlob);
      };

      img.onerror = () => {
        console.error('Failed to load SVG image');
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    });
  }

  private downloadImageFile(blob: Blob, fileName: string): void {
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

    console.log('Screenshot downloaded:', fileName);
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

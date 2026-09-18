import { Component, Input, ViewChild, ElementRef, OnChanges, SimpleChanges } from '@angular/core';

export interface CandleData {
  open: number;
  close: number;
  low: number;
  high: number;
  direction: string;
}

@Component({
  selector: 'app-candle-chart',
  templateUrl: './candle-chart.component.html',
  styleUrls: ['./candle-chart.component.css']
})
export class CandleChartComponent implements OnChanges {
  @Input() candles: CandleData[] = [];

  chartInstance: any = null;
  ctx: CanvasRenderingContext2D | null = null;

  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  ngOnChanges(changes: SimpleChanges): void {
    console.log('ngOnChanges called with changes:', changes);

    if (changes['candles']) {
      const prevCandles = changes['candles'].previousValue;
      const currCandles = changes['candles'].currentValue;

      console.log('Previous candles:', prevCandles?.length, 'Current candles:', currCandles?.length);

      // Render when candles change from empty to populated (component just appeared in DOM)
      if (!prevCandles && currCandles && currCandles.length > 0) {
        console.log('Candles changed from empty to populated, rendering chart');
        setTimeout(() => {
          this.renderChart();
        }, 0);
      }

      // Re-render if candles changed after initial load (and component is already in DOM)
      if (prevCandles && currCandles && !changes['candles'].firstChange) {
        console.log('Re-rendering chart due to candle changes');
        setTimeout(() => {
          this.renderChart();
        }, 0);
      }

      // Initial render when component is created with candles data
      if (currCandles && currCandles.length > 0) {
        console.log('Initial render with candles data');
        setTimeout(() => {
          this.renderChart();
        }, 0);
      }
    }
  }

  ngOnInit(): void {
    console.log('ngOnInit called, candles:', this.candles);

    if (this.chartCanvas) {
      this.chartCanvas.nativeElement.addEventListener('click', () => {
        if (this.chartInstance) {
          this.chartInstance.destroy();
          this.renderChart();
        }
      });
    }

    // Render chart if we have candles data (context will be initialized in renderChart)
    if (this.candles && this.candles.length > 0) {
      console.log('Rendering chart in ngOnInit');
      this.renderChart();
    } else {
      console.log('No candles to render in ngOnInit');
    }
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  /**
   * Safely get the canvas context, initializing it if needed.
   */
  private ensureCanvasContext(): CanvasRenderingContext2D | null {
    if (!this.chartCanvas) {
      console.error('chartCanvas ElementRef is not initialized');
      return null;
    }

    const canvas = this.chartCanvas.nativeElement;
    if (!canvas) {
      console.error('Canvas element is null');
      return null;
    }

    // Get or create the canvas context lazily
    if (!this.ctx) {
      this.ctx = canvas.getContext('2d');
      if (!this.ctx) {
        console.error('Failed to get canvas context from element');
        return null;
      }
    }

    return this.ctx;
  }

  renderChart(): void {
    console.log('renderChart called');
    console.log('candles:', this.candles);

    if (!this.candles || this.candles.length === 0) {
      console.log('renderChart skipped - no candles');
      return;
    }

    const ctx = this.ensureCanvasContext();
    if (!ctx) {
      console.error('renderChart skipped - could not get canvas context');
      return;
    }

    const canvas = this.chartCanvas.nativeElement!;

    // Use actual rendered dimensions, not intrinsic width/height
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    console.log('canvas dimensions:', width, 'x', height);
    console.log('canvas intrinsic size:', canvas.width, 'x', canvas.height);
    console.log('canvas offsetWidth/Height:', canvas.offsetWidth, 'x', canvas.offsetHeight);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw a background to verify canvas is being rendered
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, width, height);

    console.log('Background drawn');

    // Calculate price range
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    this.candles.forEach(candle => {
      if (candle.low < minPrice) minPrice = candle.low;
      if (candle.high > maxPrice) maxPrice = candle.high;
    });

    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.1; // 10% padding on each side
    minPrice -= padding;
    maxPrice += padding;

    // Calculate candle width and spacing
    const totalCandles = this.candles.length;
    const chartWidth = width - 40; // Leave some margin on sides
    const candleWidth = Math.max(2, chartWidth / totalCandles - 4);
    const candleSpacing = (chartWidth - candleWidth * totalCandles) / (totalCandles + 1);

    // Draw grid lines
    this.drawGrid(ctx, width, height, minPrice, maxPrice);

    // Draw candles
    console.log('Drawing', this.candles.length, 'candles');
    this.candles.forEach((candle, index) => {
      const x = candleSpacing + (index * (candleWidth + 4));
      console.log(`Drawing candle ${index}:`, candle, 'at x:', x);
      this.drawCandle(ctx, x, candle, minPrice, maxPrice, height, candleWidth, candleSpacing);
    });

    // Draw price labels on the right
    this.drawPriceLabels(ctx, width, height, minPrice, maxPrice);

    // Draw time labels on the bottom
    this.drawTimeLabels(ctx, width, height);
  }

  drawGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    minPrice: number,
    maxPrice: number
  ): void {
    console.log('Drawing grid with width:', width, 'height:', height);

    const priceRange = maxPrice - minPrice;
    const gridLines = 5;

    for (let i = 0; i <= gridLines; i++) {
      const price = minPrice + (priceRange * (i / gridLines));
      // Use actual rendered height with 10% padding for labels
      const y = height - (height * (i / gridLines));

      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(width - 20, y);
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw price label
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(price.toFixed(2), 15, y + 3);
    }
  }

  drawCandle(
    ctx: CanvasRenderingContext2D,
    x: number,
    candle: any,
    minPrice: number,
    maxPrice: number,
    height: number,
    candleWidth: number,
    candleSpacing: number
  ): void {
    // Use actual rendered height with padding for labels
    const chartHeight = height * 0.9;

    console.log('Chart height:', chartHeight);
    console.log('Candle data:', candle);

    const candleHeight = (candle.high - candle.low) / ((maxPrice - minPrice) / chartHeight);
    const yOpen = height - ((candle.open - minPrice) / (maxPrice - minPrice)) * chartHeight;
    const yClose = height - ((candle.close - minPrice) / (maxPrice - minPrice)) * chartHeight;
    const yLow = height - ((candle.low - minPrice) / (maxPrice - minPrice)) * chartHeight;
    const yHigh = height - ((candle.high - minPrice) / (maxPrice - minPrice)) * chartHeight;

    console.log('Drawing candle:', candle, 'at x:', x);
    console.log('  yOpen:', yOpen, 'yClose:', yClose, 'yLow:', yLow, 'yHigh:', yHigh);

    const isUp = candle.close >= candle.open;
    const color = isUp ? '#4CAF50' : '#f44336';

    // Draw wick
    ctx.beginPath();
    ctx.moveTo(x + candleWidth / 2, yLow);
    ctx.lineTo(x + candleWidth / 2, yHigh);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw body
    const bodyHeight = Math.max(1, Math.abs(yOpen - yClose));
    ctx.fillStyle = color;

    if (bodyHeight > 0) {
      console.log('Drawing body at x:', x, 'y:', Math.min(yOpen, yClose), 'width:', candleWidth, 'height:', bodyHeight);
      ctx.fillRect(x, Math.min(yOpen, yClose), candleWidth, bodyHeight);
    }

    // Draw open/close dots
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x + candleWidth / 2, yOpen, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + candleWidth / 2, yClose, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawPriceLabels(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    minPrice: number,
    maxPrice: number
  ): void {
    console.log('Drawing price labels with width:', width, 'height:', height);

    const priceRange = maxPrice - minPrice;
    const gridLines = 5;

    for (let i = 0; i <= gridLines; i++) {
      const price = minPrice + (priceRange * (i / gridLines));
      // Use actual rendered height with padding for labels
      const y = height - (height * (i / gridLines));
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(price.toFixed(2), width - 40, y + 3);
    }
  }

  drawTimeLabels(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    console.log('Drawing time labels with width:', width, 'height:', height);

    const totalCandles = this.candles.length;
    if (totalCandles <= 1) return;

    // Use actual rendered width with padding for labels
    const chartWidth = width * 0.9;

    const candleWidth = Math.max(2, chartWidth / totalCandles);
    const spacing = candleWidth + 4;

    ctx.fillStyle = '#999';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';

    // Draw labels for first, middle, and last candles
    const labelIndices = [0, Math.floor(totalCandles / 2), totalCandles - 1];

    labelIndices.forEach(index => {
      const x = width * 0.1 + (index * spacing);
      ctx.fillText(`Candle ${index + 1}`, x, height - 5);
    });
  }
}

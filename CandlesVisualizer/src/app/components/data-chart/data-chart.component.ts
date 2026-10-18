import { Component, Input, ViewChild, ElementRef, OnChanges, SimpleChanges } from '@angular/core';

export interface CandleData {
  open: number;
  close: number;
  low: number;
  high: number;
  direction: string;
}

@Component({
  selector: 'app-data-chart',
  templateUrl: './data-chart.component.html',
  styleUrls: ['./data-chart.component.css'],
  standalone: true
})
export class DataChartComponent implements OnChanges {
  @Input() candles: CandleData[] = [];

  chartInstance: any = null;
  ctx: CanvasRenderingContext2D | null = null;

  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['candles']) {
      const currCandles = changes['candles'].currentValue;
      if (currCandles && currCandles.length > 0) {
        setTimeout(() => this.renderChart(), 0);
      }
    }
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.initializeCanvasEvents();
      if (this.candles && this.candles.length > 0) {
        this.renderChart();
      }
    }, 0);
  }

  getCandlePosition(index: number): number {
    if (!this.candles || !this.chartCanvas) return 0;

    const canvas = this.chartCanvas.nativeElement;
    const width = canvas.clientWidth;
    const yAxisLabelWidth = 60;
    const chartWidth = width - yAxisLabelWidth - 20;

    const baseCandleWidth = Math.max(2, chartWidth / this.candles.length - 4);
    const candleWidth = baseCandleWidth;
    const candleSpacing = (chartWidth - candleWidth * this.candles.length) / (this.candles.length + 1);

    return candleSpacing + (index * (candleWidth + 4));
  }

  private initializeCanvasEvents(): void {
    if (!this.chartCanvas) return;

    const canvas = this.chartCanvas.nativeElement;
    if (!canvas) return;

    this.resizeCanvas(canvas);
    canvas.addEventListener('contextmenu', (e: MouseEvent) => e.preventDefault());
    canvas.addEventListener('click', () => {
      if (this.chartInstance) {
        this.chartInstance.destroy();
        this.renderChart();
      }
    });
    this.setupResizeListener(canvas);
  }

  private resizeCanvas(canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    const displayWidth = Math.round(rect.width);
    const displayHeight = Math.round(rect.height);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;

      if (this.candles && this.candles.length > 0) {
        setTimeout(() => this.renderChart(), 10);
      }
    }
  }

  private setupResizeListener(canvas: HTMLCanvasElement): void {
    let resizeTimeout: number | null = null;

    const handleResize = (): void => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        this.resizeCanvas(canvas);
        resizeTimeout = null;
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    (canvas as any)._cleanupResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
    (canvas as any)._resizeHandler = handleResize;
  }

  private ensureCanvasContext(): CanvasRenderingContext2D | null {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return null;
    if (!this.ctx) this.ctx = canvas.getContext('2d');
    return this.ctx;
  }

  renderChart(): void {
    if (!this.candles || !this.candles.length) return;

    const ctx = this.ensureCanvasContext();
    if (!ctx) return;

    const canvas = this.chartCanvas.nativeElement!;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    ctx.fillStyle = '#fafafa';
    ctx.clearRect(0, 0, width, height);
    ctx.fillRect(0, 0, width, height);

    let minPrice = Infinity;
    let maxPrice = -Infinity;

    this.candles.forEach(candle => {
      if (candle.low < minPrice) minPrice = candle.low;
      if (candle.high > maxPrice) maxPrice = candle.high;
    });

    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.1;
    minPrice -= padding;
    maxPrice += padding;

    const totalCandles = this.candles.length;
    const baseChartWidth = width - 40;
    const baseCandleWidth = Math.max(2, baseChartWidth / totalCandles - 4);
    const candleWidth = baseCandleWidth;
    const candleSpacing = (baseChartWidth - candleWidth * totalCandles) / (totalCandles + 1);

    const yAxisLabelWidth = 60;
    const chartHeight = height * 0.9;

    this.drawGrid(ctx, width, height, minPrice, maxPrice, chartHeight);

    this.candles.forEach((candle, index) => {
      const x = candleSpacing + (index * (candleWidth + 4));
      this.drawCandle(ctx, x, candle, minPrice, maxPrice, chartHeight, width, height, candleWidth, candleSpacing);
    });

    this.drawTimeLabels(ctx, width, height);
  }

  drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, minPrice: number, maxPrice: number, chartHeight: number = height * 0.9): void {
    const priceRange = maxPrice - minPrice;
    const gridLines = 5;
    const yAxisLabelWidth = 60;

    for (let i = 0; i <= gridLines; i++) {
      const price = minPrice + (priceRange * (i / gridLines));
      const y = (height - chartHeight) / 2 + ((gridLines - i) / gridLines) * chartHeight;

      ctx.beginPath();
      ctx.moveTo(yAxisLabelWidth, y);
      ctx.lineTo(width - 20, y);
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(price.toFixed(2), yAxisLabelWidth - 5, y + 4);
    }
  }

  drawCandle(ctx: CanvasRenderingContext2D, x: number, candle: any, minPrice: number, maxPrice: number, chartHeight: number, width: number, height: number, candleWidth: number, candleSpacing: number): void {
    const padding = (height - chartHeight) / 2;
    const yOpen = padding + ((maxPrice - candle.open) / (maxPrice - minPrice)) * chartHeight;
    const yClose = padding + ((maxPrice - candle.close) / (maxPrice - minPrice)) * chartHeight;
    const yLow = padding + ((maxPrice - candle.low) / (maxPrice - minPrice)) * chartHeight;
    const yHigh = padding + ((maxPrice - candle.high) / (maxPrice - minPrice)) * chartHeight;

    const isUp = candle.close >= candle.open;
    const color = isUp ? '#4CAF50' : '#f44336';

    ctx.beginPath();
    ctx.moveTo(x + candleWidth / 2, yLow);
    ctx.lineTo(x + candleWidth / 2, yHigh);
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.stroke();

    const bodyHeight = Math.max(1, Math.abs(yOpen - yClose));
    ctx.fillStyle = color;

    if (bodyHeight > 0) {
      ctx.fillRect(x, Math.min(yOpen, yClose), candleWidth, bodyHeight);
    }

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x + candleWidth / 2, yOpen, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + candleWidth / 2, yClose, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTimeLabels(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const totalCandles = this.candles.length;
    if (totalCandles <= 1) return;

    const chartWidth = width - 60;
    const candleWidth = Math.max(2, chartWidth / totalCandles);
    const spacing = candleWidth + 4;

    ctx.fillStyle = '#999';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';

    const labelIndices = [0, Math.floor(totalCandles / 2), totalCandles - 1];

    labelIndices.forEach(index => {
      const x = 60 + (index * spacing);
      ctx.fillText(`Candle ${index + 1}`, x, height - 5);
    });
  }
}

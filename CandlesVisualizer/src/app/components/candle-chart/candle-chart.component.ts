import { Component, Input, ViewChild, ElementRef, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';

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
  @Input() isEditableChart: boolean = false;

  // Output event for candle modifications (only for second chart)
  @Output() candleModified = new EventEmitter<CandleData>();

  chartInstance: any = null;
  ctx: CanvasRenderingContext2D | null = null;

  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  // Mouse interaction state
  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private dragStartCandleIndex: number = -1;
  private dragType: 'high' | 'low' | null = null;
  private cursorIndicator: CanvasRenderingContext2D | null = null;

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
      const canvas = this.chartCanvas.nativeElement;

      // Prevent default context menu on right click
      canvas.addEventListener('contextmenu', (e: MouseEvent) => e.preventDefault());

      // Mouse down event for starting drag on second chart
      canvas.addEventListener('mousedown', (e: MouseEvent) => this.onMouseDown(e), true);

      // Mouse move event for dragging
      canvas.addEventListener('mousemove', (e: MouseEvent) => this.onMouseMove(e), true);

      // Mouse up event for ending drag
      canvas.addEventListener('mouseup', (e: MouseEvent) => this.onMouseUp(e), true);

      // Mouse leave event to cancel drag
      canvas.addEventListener('mouseleave', (e: MouseEvent) => this.onMouseLeave(e), true);

      // Click event for chart refresh
      canvas.addEventListener('click', () => {
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

    // Clean up canvas event listeners
    if (this.chartCanvas) {
      const canvas = this.chartCanvas.nativeElement;
      canvas.removeEventListener('mousedown', this.onMouseDown.bind(this));
      canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
      canvas.removeEventListener('mouseup', this.onMouseUp.bind(this));
      canvas.removeEventListener('mouseleave', this.onMouseLeave.bind(this));
    }
  }

  /**
   * Handle mouse down event - start drag operation
   */
  private onMouseDown(event: MouseEvent): void {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;

    // Only enable drag interaction for the second chart (when candles are transferred)
    if (!this.candles || this.candles.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if clicked on a candle wick
    const candleIndex = this.findCandleAtX(x);
    if (candleIndex === -1) return;

    const candle = this.candles[candleIndex];
    if (!candle) return;

    const metrics = this.getChartMetrics();
    const { minPrice, maxPrice, chartHeight } = metrics;

    const canvasHeight = canvas.clientHeight;
    // Calculate y positions - higher prices at lower Y values (top of chart)
    const padding = (canvasHeight - chartHeight) / 2;
    const yHigh = padding + ((maxPrice - candle.high) / (maxPrice - minPrice)) * chartHeight;
    const yLow = padding + ((maxPrice - candle.low) / (maxPrice - minPrice)) * chartHeight;
    const yOpen = padding + ((maxPrice - candle.open) / (maxPrice - minPrice)) * chartHeight;
    const yClose = padding + ((maxPrice - candle.close) / (maxPrice - minPrice)) * chartHeight;

    // Check if clicked on high wick (top half of wick)
    const isHigh = y <= (yHigh + yOpen) / 2;

    this.isDragging = true;
    this.dragStartY = y;
    this.dragStartCandleIndex = candleIndex;
    this.dragType = isHigh ? 'high' : 'low';

    // Prevent default to avoid text selection and context menu
    event.preventDefault();

    // Draw cursor indicator
    this.drawCursorIndicator(x, y);
  }

  /**
   * Draw a cursor indicator to show which part of the candle is being dragged
   */
  private drawCursorIndicator(x: number, y: number): void {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas || !this.ctx) return;

    // Clear previous indicator
    this.ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    // Draw cursor based on drag type
    if (this.dragType === 'high') {
      // Draw a triangle pointing up for high drag
      this.ctx.fillStyle = '#ff9800';
      this.ctx.beginPath();
      this.ctx.moveTo(x, y - 15);
      this.ctx.lineTo(x - 8, y + 5);
      this.ctx.lineTo(x + 8, y + 5);
      this.ctx.closePath();
      this.ctx.fill();

      // Draw a horizontal line to show the high level
      this.ctx.strokeStyle = '#ff9800';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(x - 15, y);
      this.ctx.lineTo(x + canvas.clientWidth, y);
      this.ctx.stroke();

      // Draw text label
      this.ctx.fillStyle = '#ff9800';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.fillText('Drag High', x + 20, y - 5);
    } else {
      // Draw a triangle pointing down for low drag
      this.ctx.fillStyle = '#ff9800';
      this.ctx.beginPath();
      this.ctx.moveTo(x, y + 15);
      this.ctx.lineTo(x - 8, y - 5);
      this.ctx.lineTo(x + 8, y - 5);
      this.ctx.closePath();
      this.ctx.fill();

      // Draw a horizontal line to show the low level
      this.ctx.strokeStyle = '#ff9800';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(x - 15, y);
      this.ctx.lineTo(x + canvas.clientWidth, y);
      this.ctx.stroke();

      // Draw text label
      this.ctx.fillStyle = '#ff9800';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.fillText('Drag Low', x + 20, y + 25);
    }
  }

  /**
   * Handle mouse move event - update candle values during drag
   */
  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging || this.dragStartCandleIndex === -1) return;

    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;

    // Get canvas position relative to viewport
    const rect = canvas.getBoundingClientRect();

    // Calculate mouse Y position relative to chart area (accounting for padding)
    const y = event.clientY - rect.top;

    // Clamp Y to chart bounds (with padding for labels)
    const chartHeight = canvas.clientHeight * 0.9;
    const clampedY = Math.max(chartHeight / 2 - chartHeight / 2, Math.min(y, rect.height - chartHeight / 2 - chartHeight / 2));

    // Calculate new price based on drag position
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

    // Calculate new price based on y position (lower Y = higher price)
    const normalizedY = clampedY / chartHeight;
    let newPrice: number;
    if (this.dragType === 'high') {
      // For high, lower Y position = higher price
      newPrice = maxPrice - (normalizedY * priceRange);
    } else {
      // For low, higher Y position = lower price
      newPrice = minPrice + ((1 - normalizedY) * priceRange);
    }

    // Update the candle data
    const candle = this.candles[this.dragStartCandleIndex];
    if (candle) {
      const oldHigh = candle.high;
      const oldLow = candle.low;

      if (this.dragType === 'high') {
        // High must be >= close price
        candle.high = Math.max(candle.close, newPrice);
      } else {
        // Low must be <= open price
        candle.low = Math.min(candle.open, newPrice);
      }

      // Ensure low doesn't exceed high
      if (candle.low > candle.high) {
        candle.low = candle.high;
      }

      // Emit the modified candle (only for second chart)
      this.candleModified.emit(candle);

      // Re-render the chart
      setTimeout(() => {
        this.renderChart();
      }, 0);

      console.log(`Modified candle ${this.dragStartCandleIndex}: high=${oldHigh} -> ${candle.high}, low=${oldLow} -> ${candle.low}`);
    }

    // Redraw cursor indicator at new position (use event coordinates for proper tracking)
    this.drawCursorIndicator(rect.left + event.clientX - rect.left, clampedY);
  }

  /**
   * Handle mouse up event - end drag operation
   */
  private onMouseUp(event: MouseEvent): void {
    this.isDragging = false;
    this.dragStartY = 0;
    this.dragStartCandleIndex = -1;
    this.dragType = null;

    // Clear cursor indicator using main context
    if (this.ctx && this.chartCanvas) {
      const canvas = this.chartCanvas.nativeElement;
      if (canvas) {
        this.ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      }
    }
  }

  /**
   * Handle mouse leave event - cancel drag operation
   */
  private onMouseLeave(event: MouseEvent): void {
    this.isDragging = false;
    this.dragStartY = 0;
    this.dragStartCandleIndex = -1;
    this.dragType = null;

    // Clear cursor indicator using main context
    if (this.ctx && this.chartCanvas) {
      const canvas = this.chartCanvas.nativeElement;
      if (canvas) {
        this.ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      }
    }
  }

  /**
   * Find the candle index at a given x position
   */
  private findCandleAtX(x: number): number {
    if (!this.candles || this.candles.length === 0) return -1;

    const width = this.chartCanvas?.nativeElement.clientWidth || 800;
    // Use consistent chart width calculation with drawGrid and drawCandle
    const yAxisLabelWidth = 60;
    const chartWidth = width - yAxisLabelWidth - 20; // Adjust for right margin
    const baseCandleWidth = Math.max(2, chartWidth / this.candles.length - 4);
    const candleWidth = this.isEditableChart ? baseCandleWidth * 1.4 : baseCandleWidth;
    const candleSpacing = (chartWidth - candleWidth * this.candles.length) / (this.candles.length + 1);

    for (let i = 0; i < this.candles.length; i++) {
      const candleX = candleSpacing + (i * (candleWidth + 4));
      if (x >= candleX && x <= candleX + candleWidth) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Helper function to get current chart metrics for drag operations
   */
  private getChartMetrics(): {
    minPrice: number;
    maxPrice: number;
    chartHeight: number;
  } {
    if (!this.candles || this.candles.length === 0) return {} as any;

    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return {} as any;

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

    const chartHeight = canvas.clientHeight * 0.9;
    const yAxisLabelWidth = 60;

    return { minPrice, maxPrice, chartHeight };
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
    const baseChartWidth = width - 40; // Leave some margin on sides
    const baseCandleWidth = Math.max(2, baseChartWidth / totalCandles - 4);
    const candleWidth = this.isEditableChart ? baseCandleWidth * 1.4 : baseCandleWidth;
    const candleSpacing = (baseChartWidth - candleWidth * totalCandles) / (totalCandles + 1);

    // Calculate chart area (leaving space for Y-axis labels on the left)
    const yAxisLabelWidth = 60;

    // Calculate chart height (90% of canvas height)
    const chartHeight = height * 0.9;

    // Draw grid lines
    this.drawGrid(ctx, width, height, minPrice, maxPrice, chartHeight);

    // Draw candles
    console.log('Drawing', this.candles.length, 'candles');
    this.candles.forEach((candle, index) => {
      const x = candleSpacing + (index * (candleWidth + 4));
      console.log(`Drawing candle ${index}:`, candle, 'at x:', x);
      this.drawCandle(ctx, x, candle, minPrice, maxPrice, chartHeight, width, height, candleWidth, candleSpacing);
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
    maxPrice: number,
    chartHeight: number = height * 0.9
  ): void {
    console.log('Drawing grid with width:', width, 'height:', height, 'chartHeight:', chartHeight);

    const priceRange = maxPrice - minPrice;
    const gridLines = 5;

    // Calculate chart area (leaving space for Y-axis labels on the left)
    const yAxisLabelWidth = 60;

    for (let i = 0; i <= gridLines; i++) {
      // Higher prices at lower Y values (top of chart)
      const price = minPrice + (priceRange * (i / gridLines));

      // Calculate Y position: evenly distribute across chart height with padding
      const y = (height - chartHeight) / 2 + ((gridLines - i) / gridLines) * chartHeight;

      ctx.beginPath();
      // Start from right edge of Y-axis labels, go across chart area
      ctx.moveTo(yAxisLabelWidth, y);
      ctx.lineTo(width - 20, y);
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw price label to the left of grid line
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(price.toFixed(2), yAxisLabelWidth - 5, y + 4);
    }
  }

  drawCandle(
    ctx: CanvasRenderingContext2D,
    x: number,
    candle: any,
    minPrice: number,
    maxPrice: number,
    chartHeight: number,
    width: number,
    height: number,
    candleWidth: number,
    candleSpacing: number
  ): void {
    console.log('Chart height:', chartHeight);
    console.log('Candle data:', candle);

    // Calculate y positions - higher prices at lower Y values (top of chart)
    const padding = (height - chartHeight) / 2;
    const yOpen = padding + ((maxPrice - candle.open) / (maxPrice - minPrice)) * chartHeight;
    const yClose = padding + ((maxPrice - candle.close) / (maxPrice - minPrice)) * chartHeight;
    const yLow = padding + ((maxPrice - candle.low) / (maxPrice - minPrice)) * chartHeight;
    const yHigh = padding + ((maxPrice - candle.high) / (maxPrice - minPrice)) * chartHeight;

    console.log('Drawing candle:', candle, 'at x:', x);
    console.log('  yOpen:', yOpen, 'yClose:', yClose, 'yLow:', yLow, 'yHigh:', yHigh);

    const isUp = candle.close >= candle.open;
    const color = isUp ? '#4CAF50' : '#f44336';

    // Draw wick
    ctx.beginPath();
    ctx.moveTo(x + candleWidth / 2, yLow);
    ctx.lineTo(x + candleWidth / 2, yHigh);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
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
    maxPrice: number,
    chartHeight: number = height * 0.9
  ): void {
    console.log('Drawing price labels with width:', width, 'height:', height, 'chartHeight:', chartHeight);

    const priceRange = maxPrice - minPrice;
    const gridLines = 5;

    // Calculate chart area (leaving space for Y-axis labels on the left)
    const yAxisLabelWidth = 60;

    for (let i = 0; i <= gridLines; i++) {
      // Higher prices at lower Y values (top of chart)
      const price = minPrice + (priceRange * (i / gridLines));

      // Calculate Y position: evenly distribute across chart height with padding
      const y = (height - chartHeight) / 2 + ((gridLines - i) / gridLines) * chartHeight;

      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      // Position labels to the right of chart area
      ctx.fillText(price.toFixed(2), width - 40, y + 4);
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
    const chartWidth = width - 60; // Leave space for Y-axis and right labels

    const candleWidth = Math.max(2, chartWidth / totalCandles);
    const spacing = candleWidth + 4;

    ctx.fillStyle = '#999';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';

    // Draw labels for first, middle, and last candles
    const labelIndices = [0, Math.floor(totalCandles / 2), totalCandles - 1];

    labelIndices.forEach(index => {
      const x = 60 + (index * spacing); // Start from yAxisLabelWidth position
      ctx.fillText(`Candle ${index + 1}`, x, height - 5);
    });
  }
}

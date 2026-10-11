import { Component, Input, ViewChild, ElementRef, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CdkDrag, CdkDragStart, CdkDragEnd, CdkDragMove, CdkDragEnter, CdkDragExit, CdkDragDrop, CdkDropList, DragRef } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';

export interface CandleData {
  open: number;
  close: number;
  low: number;
  high: number;
  direction: string;
}

/**
 * CDK Drag-Drop drag item for candle resizing
 */
class DragCandle {
  constructor(
    public index: number,
    public element: CandleData | null = null,
    public dragType: 'high' | 'low' | null = null
  ) {}
}

@Component({
  selector: 'app-candle-chart',
  templateUrl: './candle-chart.component.html',
  styleUrls: ['./candle-chart.component.css'],
  standalone: true,
  imports: [CommonModule, CdkDropList, CdkDrag]
})
export class CandleChartComponent implements OnChanges {
  @Input() candles: CandleData[] = [];
  @Input() isEditableChart: boolean = false;

  // Output event for candle modifications (only for second chart)
  @Output() candleModified = new EventEmitter<CandleData>();

  chartInstance: any = null;
  ctx: CanvasRenderingContext2D | null = null;

  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  // CDK Drag-Drop references
  private dragRef: DragRef | null = null;

  // Mouse interaction state (legacy - will be replaced by CDK)
  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private dragStartCandleIndex: number = -1;
  private dragType: 'high' | 'low' | null = null;
  private cursorIndicatorX: number = 0;
  private cursorIndicatorY: number = 0;
  private cursorIndicatorHeight: number = 0;
  private mouseMoveTimeout: number | null = null;

  // CDK Drag-Drop state
  private draggedCandleIndex: number = -1;
  private dragTypeCDK: 'high' | 'low' | null = null;

  // Candle data for resizing
  private candleData: { [index: number]: CandleData } = {};

  ngOnChanges(changes: SimpleChanges): void {
    console.log('ngOnChanges called with changes:', changes);

    if (changes['candles']) {
      const prevCandles = changes['candles'].previousValue;
      const currCandles = changes['candles'].currentValue;

      console.log('Previous candles:', prevCandles?.length, 'Current candles:', currCandles?.length);

      // Initialize CDK Drag-Drop when candles change from empty to populated
      if (!prevCandles && currCandles && currCandles.length > 0) {
        console.log('CDK Drag-Drop initialized for new candles');
        this.initializeCDKDragDrop();
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

    // Use setTimeout to ensure canvas is ready in the DOM
    setTimeout(() => {
      this.initializeCanvasEvents();
      this.initializeCDKDragDrop();
    }, 0);

    // Render chart if we have candles data (context will be initialized in renderChart)
    if (this.candles && this.candles.length > 0) {
      console.log('Rendering chart in ngOnInit');
      this.renderChart();
    } else {
      console.log('No candles to render in ngOnInit');
    }
  }

  /**
   * Initialize CDK Drag-Drop event listeners for editable chart
   */
  private initializeCDKDragDrop(): void {
    console.log('initializeCDKDragDrop called');

    if (!this.isEditableChart) {
      console.log('CDK Drag-Drop not enabled for non-editable chart');
      return;
    }

    if (!this.chartCanvas) {
      console.error('initializeCDKDragDrop: chartCanvas ElementRef not found');
      return;
    }

    const canvas = this.chartCanvas.nativeElement;
    if (!canvas) {
      console.error('initializeCDKDragDrop: canvas element not found');
      return;
    }

    // CDK drag-drop is handled by the overlay divs with [cdkDrag] directive
    // The events are automatically bound via template bindings

    console.log('CDK Drag-Drop initialized via overlay divs');
  }

  /**
   * Get the X position of a candle for overlay positioning
   */
  getCandlePosition(index: number): number {
    if (!this.candles || this.candles.length === 0) return 0;

    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return 0;

    const width = canvas.clientWidth;
    const yAxisLabelWidth = 60;
    const chartWidth = width - yAxisLabelWidth - 20;

    const baseCandleWidth = Math.max(2, chartWidth / this.candles.length - 4);
    const candleWidth = this.isEditableChart ? baseCandleWidth * 1.4 : baseCandleWidth;
    const candleSpacing = (chartWidth - candleWidth * this.candles.length) / (this.candles.length + 1);

    return candleSpacing + (index * (candleWidth + 4));
  }

  /**
   * Get the candle width for a specific index
   */
  getCandleWidth(index: number): number {
    if (!this.candles || this.candles.length === 0) return 0;

    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return 0;

    const width = canvas.clientWidth;
    const yAxisLabelWidth = 60;
    const chartWidth = width - yAxisLabelWidth - 20;

    const baseCandleWidth = Math.max(2, chartWidth / this.candles.length - 4);
    const candleWidth = this.isEditableChart ? baseCandleWidth * 1.4 : baseCandleWidth;
    const candleSpacing = (chartWidth - candleWidth * this.candles.length) / (this.candles.length + 1);

    return candleWidth;
  }

  /**
   * Get the candle spacing for positioning
   */
  getCandleSpacing(): number {
    if (!this.candles || this.candles.length === 0) return 0;

    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return 0;

    const width = canvas.clientWidth;
    const yAxisLabelWidth = 60;
    const chartWidth = width - yAxisLabelWidth - 20;

    const baseCandleWidth = Math.max(2, chartWidth / this.candles.length - 4);
    const candleSpacing = (chartWidth - baseCandleWidth * this.candles.length) / (this.candles.length + 1);

    return candleSpacing;
  }

  /**
   * Get the current price from a drag element for tooltip display
   */
  getCurrentPriceFromDragElement(draggableElement: HTMLElement | null): string {
    if (!draggableElement) return '';

    const candleIndexAttr = draggableElement.getAttribute('data-candle-index');
    if (!candleIndexAttr) return '';

    const index = parseInt(candleIndexAttr, 10);
    if (index < 0 || !this.candles[index]) return '';

    const dragTypeAttr = draggableElement.getAttribute('data-drag-type');
    const candle = this.candles[index];

    if (dragTypeAttr === 'high') {
      return candle.high.toFixed(2);
    } else if (dragTypeAttr === 'low') {
      return candle.low.toFixed(2);
    }

    return '';
  }

  /**
   * Update the drag element's price tooltip in real-time during dragging
   */
  updateDragElementPrice(draggableElement: HTMLElement | null): void {
    if (!draggableElement) return;

    const price = this.getCurrentPriceFromDragElement(draggableElement);
    draggableElement.setAttribute('data-price', price);
  }

  /**
   * Calculate the Y position from a mouse event (accounting for element offset)
   */
  getMouseYInCanvas(event: MouseEvent): number {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return 0;

    const rect = canvas.getBoundingClientRect();
    return event.clientY - rect.top;
  }

  /**
   * Handle mouse move on drag elements for real-time price preview
   */
  onMouseMoveOnDrag(event: MouseEvent): void {
    if (!this.isEditableChart || !this.dragTypeCDK) return;

    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;

    const yPosition = this.getMouseYInCanvas(event);
    const price = this.calculatePriceFromY(yPosition);

    // Update the drag element's tooltip
    const draggableElement = event.target as HTMLElement;
    if (draggableElement) {
      draggableElement.setAttribute('data-price', price.toFixed(2));
    }

    // Update the cursor indicator position if dragging
    if (this.draggedCandleIndex !== -1) {
      const candle = this.candles[this.draggedCandleIndex];
      if (candle) {
        // Update the indicator to show current price level
        const candleX = this.getCandlePosition(this.draggedCandleIndex);

        // Clear previous indicator
        this.clearCursorIndicator();

        // Draw new cursor indicator at current position
        const ctx = this.ensureCanvasContext();
        if (ctx && candleX) {
          // Draw horizontal line at current price level
          ctx.strokeStyle = this.dragTypeCDK === 'high' ? '#ff5722' : '#4caf50';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          const padding = (canvas.clientHeight - canvas.clientHeight * 0.9) / 2;
          const y = this.calculateYFromPrice(price, padding);
          ctx.moveTo(candleX - 15, y);
          ctx.lineTo(candleX + canvas.clientWidth, y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw price label
          ctx.fillStyle = this.dragTypeCDK === 'high' ? '#ff5722' : '#4caf50';
          ctx.font = '11px Arial';
          ctx.textAlign = 'left';
          ctx.fillText(price.toFixed(2), candleX + 10, y - 5);
        }
      }
    }
  }

  /**
   * Setup mouse move listener for real-time price preview during drag
   */
  setupDragMouseMoveListener(): void {
    if (!this.isEditableChart || this.draggedCandleIndex === -1) return;

    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;

    // Add mousemove listener to canvas for real-time price preview
    const handleMouseMove = (event: MouseEvent): void => {
      this.onMouseMoveOnDrag(event);
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    // Store reference for cleanup
    (canvas as any)._dragMouseMoveHandler = handleMouseMove;
  }

  /**
   * Cleanup drag-related event listeners
   */
  cleanupDragListeners(): void {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;

    if ((canvas as any)._dragMouseMoveHandler) {
      const handler = (canvas as any)._dragMouseMoveHandler;
      canvas.removeEventListener('mousemove', handler);
      delete (canvas as any)._dragMouseMoveHandler;
    }
  }

  /**
   * Initialize canvas event listeners after DOM is ready
   */
  private initializeCanvasEvents(): void {
    console.log('initializeCanvasEvents called');

    if (!this.chartCanvas) {
      console.error('initializeCanvasEvents: chartCanvas ElementRef not found');
      return;
    }

    const canvas = this.chartCanvas.nativeElement;
    if (!canvas) {
      console.error('initializeCanvasEvents: canvas element not found');
      return;
    }

    console.log('initializeCanvasEvents: canvas ready, dimensions:', canvas.clientWidth, 'x', canvas.clientHeight);

    // Ensure canvas intrinsic size matches CSS dimensions
    this.resizeCanvas(canvas);

    // Prevent default context menu on right click
    canvas.addEventListener('contextmenu', (e: MouseEvent) => e.preventDefault());

    // Click event for chart refresh
    canvas.addEventListener('click', () => {
      if (this.chartInstance) {
        this.chartInstance.destroy();
        this.renderChart();
      }
    });

    // Setup drag mouse move listener for real-time price preview
    this.setupDragMouseMoveListener();

    // Listen for window resize to update canvas size
    this.setupResizeListener(canvas);

    console.log('Canvas event listeners initialized');
  }

  /**
   * Resize canvas intrinsic size to match CSS dimensions
   */
  private resizeCanvas(canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    const displayWidth = Math.round(rect.width);
    const displayHeight = Math.round(rect.height);

    // Only resize if dimensions changed
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      console.log('Resizing canvas:', displayWidth, 'x', displayHeight);
      canvas.width = displayWidth;
      canvas.height = displayHeight;

      // Re-render chart after resize
      if (this.candles && this.candles.length > 0) {
        setTimeout(() => this.renderChart(), 0);
      }
    }
  }

  /**
   * Setup resize listener to handle window resizing
   */
  private setupResizeListener(canvas: HTMLCanvasElement): void {
    let resizeTimeout: number | null = null;

    const handleResize = (): void => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      resizeTimeout = window.setTimeout(() => {
        this.resizeCanvas(canvas);
        resizeTimeout = null;
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    // Store cleanup function for later
    (canvas as any)._cleanupResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      window.removeEventListener('resize', handleResize);
    };

    // Store reference for cleanup in ngOnDestroy
    (canvas as any)._resizeHandler = handleResize;
  }



  /**
   * Draw a cursor indicator to show which part of the candle is being dragged
   */
  private drawCursorIndicator(x: number, y: number): void {
    const canvas = this.chartCanvas?.nativeElement;
    if (!this.isEditableChart) {
      console.log('drawCursorIndicator: not enabled for non-editable chart');
      return;
    }

    if (!canvas || !this.ctx) return;

    // Store cursor position for later cleanup
    this.cursorIndicatorX = x;
    this.cursorIndicatorY = y;

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

      // Calculate indicator height (triangle + text)
      this.cursorIndicatorHeight = 30; // Triangle (20px) + text (~15px including baseline)
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

      // Calculate indicator height (triangle + text)
      this.cursorIndicatorHeight = 40; // Triangle (20px) + text (~25px including baseline)
    }
  }


  /**
   * Calculate price from Y position (higher prices at lower Y values)
   */
  private calculatePriceFromY(yPosition: number): number {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return 0;

    const rect = canvas.getBoundingClientRect();
    const yInCanvas = yPosition - rect.top;

    // Get chart metrics for proper price calculation
    const metrics = this.getChartMetrics();
    if (!metrics.minPrice || !metrics.maxPrice) return 0;

    const { minPrice, maxPrice, chartHeight } = metrics;
    const padding = (canvas.clientHeight - chartHeight) / 2;

    // Clamp Y to actual chart bounds
    const clampedY = Math.max(padding, Math.min(yInCanvas, padding + chartHeight));

    // Calculate normalized Y (0 at top of chart area, 1 at bottom)
    const normalizedY = (clampedY - padding) / chartHeight;

    // Calculate price: higher Y position = lower price
    return minPrice + (normalizedY * (maxPrice - minPrice));
  }

  /**
   * Get the candle element to be dragged (for CDK Drag API)
   */
  dragCandle(index: number): any {
    const candle = this.candles[index];
    if (!candle) return null;

    // Return a DragCandle instance for CDK Drag-Drop
    const dragItem = new DragCandle(index, candle, null);

    // Store the original data for resizing operations
    this.candleData[index] = { ...candle };

    return dragItem;
  }

  /**
   * Get the candle list for CDK DropList API
   */
  dragCandleList(): any {
    return this.candles;
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

    // Draw price labels on the right - DISABLED
    // this.drawPriceLabels(ctx, width, height, minPrice, maxPrice);

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
    ctx.lineWidth = 6;
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

  // drawPriceLabels(
  //   ctx: CanvasRenderingContext2D,
  //   width: number,
  //   height: number,
  //   minPrice: number,
  //   maxPrice: number,
  //   chartHeight: number = height * 0.9
  // ): void {
  //   console.log('Drawing price labels with width:', width, 'height:', height, 'chartHeight:', chartHeight);

  //   const priceRange = maxPrice - minPrice;
  //   const gridLines = 5;

  //   // Calculate chart area (leaving space for Y-axis labels on the left)
  //   const yAxisLabelWidth = 60;

  //   for (let i = 0; i <= gridLines; i++) {
  //     // Higher prices at lower Y values (top of chart)
  //     const price = minPrice + (priceRange * (i / gridLines));

  //     // Calculate Y position: evenly distribute across chart height with padding
  //     const y = (height - chartHeight) / 2 + ((gridLines - i) / gridLines) * chartHeight;

  //     ctx.fillStyle = '#666';
  //     ctx.font = '12px Arial';
  //     ctx.textAlign = 'left';
  //     // Position labels to the right of chart area
  //     ctx.fillText(price.toFixed(2), width - 40, y + 4);
  //   }
  // }

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

  ngOnDestroy(): void {
    console.log('ngOnDestroy called');

    // Clean up CDK Drag-Drop references
    this.dragRef = null;


    // Clean up drag-related listeners first
    this.cleanupDragListeners();

    // Clean up mouse move timeout
    if (this.mouseMoveTimeout) {
      clearTimeout(this.mouseMoveTimeout);
      this.mouseMoveTimeout = null;
    }

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    // Clean up canvas event listeners
    if (this.chartCanvas) {
      const canvas = this.chartCanvas.nativeElement;
      if (canvas) {
        console.log('Cleaning up canvas event listeners');

        // Clean up resize listener
        if ((canvas as any)._cleanupResize) {
          (canvas as any)._cleanupResize();
        }

        // Clean up drag mouse move handler
        if ((canvas as any)._dragMouseMoveHandler) {
          const handler = (canvas as any)._dragMouseMoveHandler;
          canvas.removeEventListener('mousemove', handler);
          delete (canvas as any)._dragMouseMoveHandler;
        }

        // Clear cursor indicator
        this.clearCursorIndicator();
      }
    }

    console.log('ngOnDestroy completed');
  }


  /**
   * Handle CDK Drag Start event for candle resizing
   */
  onCdkDragStart(event: CdkDragStart): void {
    console.log('CDK Drag Start:', event);

    const dragRef = (event as any).dragRef;
    if (!dragRef) {
      console.log('No drag ref available');
      return;
    }

    this.dragRef = dragRef;
    this.setupDragMouseMoveListener();

    // Get the candle index and type from data attributes
    const dragElement = event.source.element.nativeElement as HTMLElement;
    const candleIndexAttr = dragElement.getAttribute('data-candle-index');
    const dragTypeAttr = dragElement.getAttribute('data-drag-type');

    if (candleIndexAttr) {
      this.draggedCandleIndex = parseInt(candleIndexAttr, 10);
    }

    if (dragTypeAttr) {
      this.dragTypeCDK = dragTypeAttr as 'high' | 'low';
    }

    console.log('Drag started on candle index:', this.draggedCandleIndex, 'type:', this.dragTypeCDK);
  }

  /**
   * Handle CDK Drag End event for candle resizing
   */
  onCdkDragEnd(event: CdkDragEnd): void {
    console.log('CDK Drag End:', event);

    // Clean up drag listeners
    this.cleanupDragListeners();

    // Get the new position from the drop list
    const dropList = (event as any).dropList;
    if (!dropList) {
      console.log('No drop list available');
      return;
    }

    const position = dropList.getItemPosition((event as any).drag);
    console.log('Drop position:', position);

    // Update the candle data based on drag type and movement
    if (this.draggedCandleIndex !== -1 && this.candles[this.draggedCandleIndex]) {
      const candle = this.candles[this.draggedCandleIndex];

      if (this.dragTypeCDK === 'high') {
        // Dragging high: moving down decreases the high price
        const movement = position.y;
        const priceChange = -movement * 0.1; // Sensitivity factor

        let newHigh = Math.max(candle.low, candle.open - priceChange, candle.close - priceChange);
        newHigh = Math.min(newHigh, candle.high + 10); // Limit the change

        if (newHigh !== candle.high) {
          this.updateCandleData(this.draggedCandleIndex, { ...candle, high: newHigh });
          console.log('Updated candle high:', this.draggedCandleIndex, 'from', candle.high, 'to', newHigh);
        }
      } else if (this.dragTypeCDK === 'low') {
        // Dragging low: moving up increases the low price
        const movement = position.y;
        const priceChange = -movement * 0.1; // Sensitivity factor

        let newLow = Math.min(candle.high, candle.open + priceChange, candle.close + priceChange);
        newLow = Math.max(newLow, candle.low - 10); // Limit the change

        if (newLow !== candle.low) {
          this.updateCandleData(this.draggedCandleIndex, { ...candle, low: newLow });
          console.log('Updated candle low:', this.draggedCandleIndex, 'from', candle.low, 'to', newLow);
        }
      }

      // Emit the modified candle data
      this.candleModified.emit(this.candles[this.draggedCandleIndex]);
    }

    // Reset drag state
    this.dragRef = null;
    this.draggedCandleIndex = -1;
    this.dragTypeCDK = null;

    // Clear cursor indicator
    this.clearCursorIndicator();
  }

  /**
   * Handle CDK Drag Over event for drop positioning
   */
  onCdkDragOver(event: CdkDragMove): void {
    // Allow drop over any element (default behavior)
  }

  /**
   * Handle CDK Drag Enter event for visual feedback
   */
  onCdkDragEnter(event: CdkDragEnter): void {
    console.log('CDK Drag Enter:', event);

    const dropList = (event as any).dropList;
    if (!dropList) return;

    const position = dropList.getItemPosition((event as any).drag);
    console.log('Entered at position:', position);

    // Highlight the element being dragged over
    const dragElement = event.item.element.nativeElement;
    if (dragElement) {
      dragElement.style.opacity = '0.6';
    }
  }

  /**
   * Handle CDK Drag Leave event for visual feedback cleanup
   */
  onCdkDragLeave(event: CdkDragExit): void {
    console.log('CDK Drag Leave:', event);

    const dragElement = event.item.element.nativeElement;
    if (dragElement) {
      // Restore opacity when leaving
      dragElement.style.opacity = '';
    }
  }

  /**
   * Handle CDK Drag Move event for real-time preview
   */
  onCdkDragMove(event: CdkDragMove): void {
    console.log('CDK Drag Move:', event);

    const dropList = (event as any).dropList;
    if (!dropList) return;

    const position = dropList.getItemPosition((event as any).drag);
    console.log('Current drag position:', position);

    // Update the cursor indicator in real-time
    if (this.draggedCandleIndex !== -1 && this.candles[this.draggedCandleIndex]) {
      const candle = this.candles[this.draggedCandleIndex];

      if (this.dragTypeCDK === 'high') {
        // Calculate the new high price based on Y position
        const yPosition = position.y;
        const priceChange = -yPosition * 0.1;

        let newHigh = Math.max(candle.low, candle.open - priceChange, candle.close - priceChange);
        newHigh = Math.min(newHigh, candle.high + 10);

        // Update the drag element's tooltip
        const draggableElement = event.source.element.nativeElement;
        if (draggableElement) {
          draggableElement.setAttribute('data-price', newHigh.toFixed(2));
        }

        // Update cursor indicator to show current price level
        this.updateCursorIndicator(candle, newHigh);
      } else if (this.dragTypeCDK === 'low') {
        // Calculate the new low price based on Y position
        const yPosition = position.y;
        const priceChange = -yPosition * 0.1;

        let newLow = Math.min(candle.high, candle.open + priceChange, candle.close + priceChange);
        newLow = Math.max(newLow, candle.low - 10);

        // Update the drag element's tooltip
        const draggableElement = event.source.element.nativeElement;
        if (draggableElement) {
          draggableElement.setAttribute('data-price', newLow.toFixed(2));
        }

        // Update cursor indicator to show current price level
        this.updateCursorIndicator(candle, newLow);
      }
    }
  }

  /**
   * Handle CDK Drop List dropped event
   */
  onCdkDrop(event: CdkDragDrop<CandleData[]>): void {
    console.log('CDK Drop:', event);

    // Move or remove items from the drop list based on the new position
    event.container.data.splice(event.currentIndex, 0, ...event.previousContainer.data.splice(event.previousIndex, 1));

    // Re-render the chart with updated data
    setTimeout(() => {
      this.renderChart();
    }, 0);
  }

  /**
   * Update the cursor indicator to show current price level during drag
   */
  private updateCursorIndicator(candle: CandleData, price: number): void {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;

    // Clear previous indicator
    this.clearCursorIndicator();

    // Draw new cursor indicator at current position
    const ctx = this.ensureCanvasContext();
    if (ctx) {
      const candleX = this.getCandlePosition(this.draggedCandleIndex);

      // Draw horizontal line at current price level
      ctx.strokeStyle = this.dragTypeCDK === 'high' ? '#ff5722' : '#4caf50';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();

      const padding = (canvas.clientHeight - canvas.clientHeight * 0.9) / 2;
      const y = this.calculateYFromPrice(price, padding);

      ctx.moveTo(candleX - 15, y);
      ctx.lineTo(candleX + canvas.clientWidth, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw price label
      ctx.fillStyle = this.dragTypeCDK === 'high' ? '#ff5722' : '#4caf50';
      ctx.font = '11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(price.toFixed(2), candleX + 10, y - 5);
    }
  }

  /**
   * Calculate Y position from a price value
   */
  private calculateYFromPrice(price: number, padding: number): number {
    if (!this.candles || this.candles.length === 0) return 0;

    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return 0;

    const metrics = this.getChartMetrics();
    if (!metrics.minPrice || !metrics.maxPrice) return 0;

    const { minPrice, maxPrice, chartHeight } = metrics;
    const priceRange = maxPrice - minPrice;

    if (priceRange === 0) {
      return padding + chartHeight / 2;
    }

    // Calculate normalized Y (0 at top of chart area, 1 at bottom)
    const normalizedY = (price - minPrice) / priceRange;

    // Calculate Y position
    return padding + normalizedY * chartHeight;
  }

  /**
   * Update candle data and store it for reference
   */
  private updateCandleData(index: number, updatedCandle: CandleData): void {
    this.candles[index] = updatedCandle;
    this.candleData[index] = { ...updatedCandle };

    // Store the drag reference for potential future operations
    if (this.dragRef) {
      this.dragRef.data = { index, ...updatedCandle };
    }
  }

  /**
   * Clear the cursor indicator from the canvas
   */
  private clearCursorIndicator(): void {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas || !this.ctx) return;

    // Only clear a small area around the indicator text, not from (0, 0)
    // This prevents clearing the top portion of the chart where grid lines and candles are drawn
    if (this.cursorIndicatorY > 0 && this.cursorIndicatorHeight > 0) {
      // Clear only a small area around the indicator text (not from top-left corner)
      const clearHeight = this.cursorIndicatorHeight + 10; // Add some buffer
      // Clear only a small area around the cursor position, not from (0, 0)
      // The text is drawn at y - 5 for high drag or y + 25 for low drag
      // We clear from the top of where the text would be drawn (y - 5 for high, y + 25 for low)
      const textY = this.dragTypeCDK === 'high' ? this.cursorIndicatorY - 5 : this.cursorIndicatorY + 25;
      // Only clear if text is within canvas bounds
      if (textY >= 0) {
        this.ctx.clearRect(this.cursorIndicatorX - 20, textY - 5, 60, clearHeight);
      }
    }

    // Reset cursor indicator position and drag type
    this.cursorIndicatorX = 0;
    this.cursorIndicatorY = 0;
    this.cursorIndicatorHeight = 0;
    this.dragTypeCDK = null;
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
}

import {Component, ElementRef, EventEmitter, Input, Output, AfterViewInit, ViewChild, OnChanges, SimpleChanges} from '@angular/core';
import {calculateCandlePriceRange, calculateCandleLayout} from '../../utils/candle-calculations';

export interface CandleData {
  open: number;
  close: number;
  low: number;
  high: number;
  direction?: string;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

@Component({
  selector: 'app-editable-chart',
  templateUrl: './editable-chart.component.html',
  styleUrls: ['./editable-chart.component.css'],
  standalone: true
})
export class EditableChartComponent implements AfterViewInit, OnChanges {
  formatNumber(value: number): string {
    return value.toFixed(2);
  }
  @Input() candles: CandleData[] = [];

  @Output() candleModified = new EventEmitter<CandleData>();

  @ViewChild('chartSvg', { static: false }) svgElement!: ElementRef<SVGSVGElement>;
  private resizeTimeout: number | null = null;
  private dragTimeout: number | null = null;
  private readonly dragThreshold = 2; // Minimum pixels to drag before updating price
  private chartMinPrice: number = 0;
  private chartMaxPrice: number = 0;
  private chartHeightVal: number = 0;

  ngAfterViewInit(): void {
    if (this.svgElement) {
      this.resizeSvg();
      this.setupResizeListener();
      if (this.candles && this.candles.length > 0) {
        this.renderChart();
      }
    }
  }

  onCandleDragEnd(
    candleIndex: number,
    handleType: 'open' | 'close',
    startPrice: number,
    endPrice: number,
    initialCandleData?: { open: number; close: number; low: number; high: number }
  ): void {
    if (this.dragTimeout) clearTimeout(this.dragTimeout);

    this.dragTimeout = window.setTimeout(() => {
      const priceDiff = Math.abs(endPrice - startPrice);
      if (priceDiff >= this.dragThreshold) {
        const candle = this.candles[candleIndex];
        console.log('candle', candle);
        console.log('initialCandleData', initialCandleData);

        // Use initial values if provided, otherwise use current values
        const initialOpen = initialCandleData?.open ?? candle.open;
        const initialClose = initialCandleData?.close ?? candle.close;
        const initialLow = initialCandleData?.low ?? candle.low;
        const initialHigh = initialCandleData?.high ?? candle.high;

        if (handleType === 'open') {
          candle.open = endPrice;
          // Preserve existing high, only update low if new open is lower
          candle.low = Math.min(endPrice, initialClose, initialLow);
        } else {
          candle.close = endPrice;
          // Preserve existing low, only update high if new close is higher
          candle.high = Math.max(initialOpen, endPrice, initialHigh);
        }

        this.candleModified.emit(candle);
        this.renderChart();
      }
    }, 50);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['candles'] && this.svgElement) {
      const currCandles = changes['candles'].currentValue;
      // Always re-render when candles change for editable chart
      if (currCandles && currCandles.length > 0) {
        this.renderChart();
      }
    }
  }

  private resizeSvg(): void {
    const svg = this.svgElement.nativeElement;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const displayWidth = Math.round(rect.width);
    const displayHeight = Math.round(rect.height);

    if (svg.clientWidth !== displayWidth || svg.clientHeight !== displayHeight) {
      svg.style.width = `${displayWidth}px`;
      svg.style.height = `${displayHeight}px`;
      svg.setAttribute('width', displayWidth.toString());
      svg.setAttribute('height', displayHeight.toString());

      if (this.candles && this.candles.length > 0) {
        setTimeout(() => this.renderChart(), 10);
      }
    }
  }

  private setupResizeListener(): void {
    const handleResize = (): void => {
      if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
      this.resizeTimeout = window.setTimeout(() => {
        this.resizeSvg();
        this.resizeTimeout = null;
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    this.svgElement.nativeElement.addEventListener('click', () => {
      this.renderChart();
    });
  }

  renderChart(): void {
    if (!this.candles || !this.candles.length) return;

    const svg = this.svgElement.nativeElement!;
    const width = svg.clientWidth;
    const height = svg.clientHeight;

    // Clear existing SVG content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    const priceRangeResult = calculateCandlePriceRange(this.candles);
    if (!priceRangeResult) {
      return;
    }

    const { minPrice, maxPrice, priceRange } = priceRangeResult;

    const totalCandles = this.candles.length;
    const layout = calculateCandleLayout(width, totalCandles);
    if (!layout) {
      return;
    }

    const { baseChartWidth, candleWidth, candleSpacing } = layout;

    const yAxisLabelWidth = 60;
    const chartHeight = height * 0.9;

    // Store values for drag handlers
    this.chartMinPrice = minPrice;
    this.chartMaxPrice = maxPrice;
    this.chartHeightVal = chartHeight;

    // Create SVG group for chart content
    const chartGroup = document.createElementNS(SVG_NS, 'g');
    chartGroup.setAttribute('transform', `translate(0, ${(height - chartHeight) / 2})`);
    svg.appendChild(chartGroup);

    // Draw grid lines and labels
    this.drawGrid(svg, chartGroup, width, height, minPrice, maxPrice, chartHeight);

    // Draw candles with drag handles
    this.candles.forEach((candle, index) => {
      const x = candleSpacing + (index * (candleWidth + 4));
      this.drawCandle(svg, chartGroup, x, candle, minPrice, maxPrice, chartHeight, width, height, candleWidth, candleSpacing, index, true);
    });

    // Draw candle indexes
    this.drawCandleIndexes(svg, chartGroup, width, height);
  }

  private drawGrid(svg: SVGSVGElement, group: SVGElement, width: number, height: number, minPrice: number, maxPrice: number, chartHeight: number): void {
    const priceRange = maxPrice - minPrice;
    const gridLines = 5;
    const yAxisLabelWidth = 60;

    for (let i = 0; i <= gridLines; i++) {
      const price = this.getPriceAtPosition(i, gridLines, minPrice, maxPrice);
      const y = this.getYPosition(i, gridLines, chartHeight);

      // Grid line
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', yAxisLabelWidth.toString());
      line.setAttribute('y1', y.toString());
      line.setAttribute('x2', (width - 20).toString());
      line.setAttribute('y2', y.toString());
      line.setAttribute('stroke', '#e0e0e0');
      line.setAttribute('stroke-width', '1');
      group.appendChild(line);

      // Y-axis label
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', (yAxisLabelWidth - 5).toString());
      text.setAttribute('y', (y + 4).toString());
      text.setAttribute('text-anchor', 'end');
      text.setAttribute('font-size', '12px');
      text.setAttribute('fill', '#666');
      text.textContent = this.formatNumber(price);
      group.appendChild(text);
    }
  }

  private getPriceAtPosition(positionIndex: number, totalPositions: number, minPrice: number, maxPrice: number): number {
    return minPrice + ((maxPrice - minPrice) * (positionIndex / totalPositions));
  }

  private getYPosition(positionIndex: number, totalPositions: number, chartHeight: number): number {
    return ((totalPositions - positionIndex) / totalPositions) * chartHeight;
  }

  private drawCandle(
    svg: SVGSVGElement,
    group: SVGElement,
    x: number,
    candle: CandleData,
    minPrice: number,
    maxPrice: number,
    chartHeight: number,
    width: number,
    height: number,
    candleWidth: number,
    candleSpacing: number,
    index?: number,
    withHandles?: boolean
  ): void {
    const yOpen = this.getYPositionForPrice(candle.open, minPrice, maxPrice, chartHeight);
    const yClose = this.getYPositionForPrice(candle.close, minPrice, maxPrice, chartHeight);
    const yLow = this.getYPositionForPrice(candle.low, minPrice, maxPrice, chartHeight);
    const yHigh = this.getYPositionForPrice(candle.high, minPrice, maxPrice, chartHeight);

    const isUp = candle.close >= candle.open;
    const color = isUp ? '#4CAF50' : '#f44336';

    // Wick (high to low line)
    const wick = document.createElementNS(SVG_NS, 'line');
    wick.setAttribute('x1', (x + candleWidth / 2).toString());
    wick.setAttribute('y1', yLow.toString());
    wick.setAttribute('x2', (x + candleWidth / 2).toString());
    wick.setAttribute('y2', yHigh.toString());
    wick.setAttribute('stroke', color);
    wick.setAttribute('stroke-width', '9');
    group.appendChild(wick);

    // Body (rectangle)
    const bodyHeight = Math.max(1, Math.abs(yOpen - yClose));
    if (bodyHeight > 0) {
      const body = document.createElementNS(SVG_NS, 'rect');
      body.setAttribute('x', x.toString());
      body.setAttribute('y', Math.min(yOpen, yClose).toString());
      body.setAttribute('width', candleWidth.toString());
      body.setAttribute('height', bodyHeight.toString());
      body.setAttribute('fill', color);
      group.appendChild(body);
    }

    // Open circle
    const openCircle = document.createElementNS(SVG_NS, 'circle');
    openCircle.setAttribute('cx', (x + candleWidth / 2).toString());
    openCircle.setAttribute('cy', yOpen.toString());
    openCircle.setAttribute('r', '4');
    openCircle.setAttribute('fill', '#fff');
    openCircle.setAttribute('stroke', withHandles ? '#999' : 'none');
    openCircle.setAttribute('stroke-width', withHandles ? '1' : '0');
    group.appendChild(openCircle);

    // Close circle
    const closeCircle = document.createElementNS(SVG_NS, 'circle');
    closeCircle.setAttribute('cx', (x + candleWidth / 2).toString());
    closeCircle.setAttribute('cy', yClose.toString());
    closeCircle.setAttribute('r', '4');
    closeCircle.setAttribute('fill', '#fff');
    closeCircle.setAttribute('stroke', withHandles ? '#999' : 'none');
    closeCircle.setAttribute('stroke-width', withHandles ? '1' : '0');
    group.appendChild(closeCircle);

    // Add drag handles if requested
    if (withHandles && index !== undefined) {
      this.addDragHandle(svg, group, x, yOpen, candle, 'open', index, candleWidth);
      this.addDragHandle(svg, group, x, yClose, candle, 'close', index, candleWidth);
    }
  }

  private getYPositionForPrice(price: number, minPrice: number, maxPrice: number, chartHeight: number): number {
    return ((maxPrice - price) / (maxPrice - minPrice)) * chartHeight;
  }

  private addDragHandle(
    svg: SVGSVGElement,
    group: SVGElement,
    x: number,
    y: number,
    candle: CandleData,
    handleType: 'open' | 'close',
    index: number,
    candleWidth: number
  ): void {
    const handle = document.createElementNS(SVG_NS, 'circle');
    handle.setAttribute('cx', (x + candleWidth / 2).toString());
    handle.setAttribute('cy', y.toString());
    handle.setAttribute('r', '6');
    handle.setAttribute('fill', '#FF9800');
    handle.setAttribute('stroke', '#E65100');
    handle.setAttribute('stroke-width', '2');
    handle.setAttribute('class', 'candle-handle');
    handle.setAttribute('data-candle-index', index.toString());
    handle.setAttribute('data-handle-type', handleType);
    handle.setAttribute('data-start-price', this.formatNumber(candle[handleType === 'open' ? 'open' : 'close']));

    // Add click event for drag start
    const handleClickEvent = document.createEvent('HTMLEvents');
    handleClickEvent.initEvent('click', true, true);
    handle.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      this.onCandleDragStart(index, handleType, parseFloat(handle.getAttribute('data-start-price') || '0'));
    });
    handle.addEventListener('mousedown', (e: MouseEvent) => {
      e.stopPropagation();
      this.onCandleDragStart(index, handleType, parseFloat(handle.getAttribute('data-start-price') || '0'));
    });

    group.appendChild(handle);
  }

  private onCandleDragStart(candleIndex: number, handleType: 'open' | 'close', startPrice: number): void {
    // Remove existing listeners to prevent duplicates
    const handles = document.querySelectorAll('.candle-handle');
    handles.forEach(handle => {
      handle.removeEventListener('mousemove', () => {});
      handle.removeEventListener('mouseup', () => {});
      handle.removeEventListener('mouseleave', () => {});
    });

    // Add new listeners
    const handle = document.querySelector(`.candle-handle[data-candle-index="${candleIndex}"][data-handle-type="${handleType}"]`)!;
    const candle = this.candles[candleIndex];

    // Store original values before drag
    const originalOpen = candle.open;
    const originalClose = candle.close;
    const originalLow = candle.low;
    const originalHigh = candle.high;

    const rect = this.svgElement.nativeElement.getBoundingClientRect();

    const onMove = (e: MouseEvent): void => {
      const mouseY = e.clientY - rect.top;

      // Calculate price based on mouse Y position
      const price = this.getPriceFromMousePosition(mouseY, rect.height, this.chartMaxPrice, this.chartMinPrice, this.chartHeightVal);

      // Update the handle's start price with 2 decimal places
      handle.setAttribute('data-start-price', this.formatNumber(price));
    };

    const onEnd = (): void => {
      this.onCandleDragEnd(candleIndex, handleType, startPrice, parseFloat(handle.getAttribute('data-start-price') || '0'), {
        open: originalOpen,
        close: originalClose,
        low: originalLow,
        high: originalHigh
      });

      // Remove listeners
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('mouseleave', onEnd);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('mouseleave', onEnd);
  }

  private getPriceFromMousePosition(mouseY: number, containerHeight: number, maxPrice: number, minPrice: number, chartHeight: number): number {
    return maxPrice - ((mouseY / chartHeight) * (maxPrice - minPrice));
  }

  private drawCandleIndexes(svg: SVGSVGElement, group: SVGElement, width: number, height: number): void {
    const totalCandles = this.candles.length;
    if (totalCandles <= 1) return;

    // Use the same calculations as renderChart to align labels with candles
    const layout = calculateCandleLayout(width, totalCandles);
    if (!layout) {
      return;
    }

    const { baseChartWidth, candleWidth, candleSpacing } = layout;

    // Draw index for each candle, aligned with the candle center
    this.candles.forEach((candle, index) => {
      const x = candleSpacing + (index * (candleWidth + 4)) + (candleWidth / 2);
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', x.toString());
      text.setAttribute('y', (height - 5).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '20px');
      text.setAttribute('fill', '#999');
      text.textContent = index.toString();
      group.appendChild(text);
    });
  }
}

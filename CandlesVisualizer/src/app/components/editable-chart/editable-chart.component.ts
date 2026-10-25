import {Component, ElementRef, EventEmitter, Input, Output, AfterViewInit, ViewChild, OnChanges, SimpleChanges} from '@angular/core';

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
    const candleWidth = Math.max(2, baseChartWidth / totalCandles - 4);
    const candleSpacing = (baseChartWidth - candleWidth * totalCandles) / (totalCandles + 1);

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
      this.drawCandleWithHandles(svg, chartGroup, x, candle, minPrice, maxPrice, chartHeight, width, height, candleWidth, candleSpacing, index);
    });

    // Draw candle indexes
    this.drawCandleIndexes(svg, chartGroup, width, height);
  }

  private drawGrid(svg: SVGSVGElement, group: SVGElement, width: number, height: number, minPrice: number, maxPrice: number, chartHeight: number): void {
    const priceRange = maxPrice - minPrice;
    const gridLines = 5;
    const yAxisLabelWidth = 60;

    for (let i = 0; i <= gridLines; i++) {
      const price = minPrice + (priceRange * (i / gridLines));
      const y = ((gridLines - i) / gridLines) * chartHeight;

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

  private drawCandle(svg: SVGSVGElement, group: SVGElement, x: number, candle: CandleData, minPrice: number, maxPrice: number, chartHeight: number, width: number, height: number, candleWidth: number, candleSpacing: number): void {
    const yOpen = ((maxPrice - candle.open) / (maxPrice - minPrice)) * chartHeight;
    const yClose = ((maxPrice - candle.close) / (maxPrice - minPrice)) * chartHeight;
    const yLow = ((maxPrice - candle.low) / (maxPrice - minPrice)) * chartHeight;
    const yHigh = ((maxPrice - candle.high) / (maxPrice - minPrice)) * chartHeight;

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
    openCircle.setAttribute('r', '3');
    openCircle.setAttribute('fill', '#fff');
    group.appendChild(openCircle);

    // Close circle
    const closeCircle = document.createElementNS(SVG_NS, 'circle');
    closeCircle.setAttribute('cx', (x + candleWidth / 2).toString());
    closeCircle.setAttribute('cy', yClose.toString());
    closeCircle.setAttribute('r', '3');
    closeCircle.setAttribute('fill', '#fff');
    group.appendChild(closeCircle);
  }

  private drawCandleWithHandles(
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
    index: number
  ): void {
    const yOpen = ((maxPrice - candle.open) / (maxPrice - minPrice)) * chartHeight;
    const yClose = ((maxPrice - candle.close) / (maxPrice - minPrice)) * chartHeight;
    const yLow = ((maxPrice - candle.low) / (maxPrice - minPrice)) * chartHeight;
    const yHigh = ((maxPrice - candle.high) / (maxPrice - minPrice)) * chartHeight;

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

    // Open circle with drag handle
    const openCircle = document.createElementNS(SVG_NS, 'circle');
    openCircle.setAttribute('cx', (x + candleWidth / 2).toString());
    openCircle.setAttribute('cy', yOpen.toString());
    openCircle.setAttribute('r', '4');
    openCircle.setAttribute('fill', '#fff');
    openCircle.setAttribute('stroke', '#999');
    openCircle.setAttribute('stroke-width', '1');

    // Add drag handle for open price
    const openHandle = document.createElementNS(SVG_NS, 'circle');
    openHandle.setAttribute('cx', (x + candleWidth / 2).toString());
    openHandle.setAttribute('cy', yOpen.toString());
    openHandle.setAttribute('r', '6');
    openHandle.setAttribute('fill', '#FF9800');
    openHandle.setAttribute('stroke', '#E65100');
    openHandle.setAttribute('stroke-width', '2');
    openHandle.setAttribute('class', 'candle-handle');
    openHandle.setAttribute('data-candle-index', index.toString());
    openHandle.setAttribute('data-handle-type', 'open');
    openHandle.setAttribute('data-start-price', this.formatNumber(candle.open));

    // Add click event for drag start
    const openClickEvent = document.createEvent('HTMLEvents');
    openClickEvent.initEvent('click', true, true);
    openHandle.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      this.onCandleDragStart(index, 'open', parseFloat(openHandle.getAttribute('data-start-price') || '0'));
    });
    openHandle.addEventListener('mousedown', (e: MouseEvent) => {
      e.stopPropagation();
      this.onCandleDragStart(index, 'open', parseFloat(openHandle.getAttribute('data-start-price') || '0'));
    });

    group.appendChild(openCircle);
    group.appendChild(openHandle);

    // Close circle with drag handle
    const closeCircle = document.createElementNS(SVG_NS, 'circle');
    closeCircle.setAttribute('cx', (x + candleWidth / 2).toString());
    closeCircle.setAttribute('cy', yClose.toString());
    closeCircle.setAttribute('r', '4');
    closeCircle.setAttribute('fill', '#fff');
    group.appendChild(closeCircle);

    // Add drag handle for close price
    const closeHandle = document.createElementNS(SVG_NS, 'circle');
    closeHandle.setAttribute('cx', (x + candleWidth / 2).toString());
    closeHandle.setAttribute('cy', yClose.toString());
    closeHandle.setAttribute('r', '6');
    closeHandle.setAttribute('fill', '#FF9800');
    closeHandle.setAttribute('stroke', '#E65100');
    closeHandle.setAttribute('stroke-width', '2');
    closeHandle.setAttribute('class', 'candle-handle');
    closeHandle.setAttribute('data-candle-index', index.toString());
    closeHandle.setAttribute('data-handle-type', 'close');
    closeHandle.setAttribute('data-start-price', this.formatNumber(candle.close));

    // Add click event for drag start
    const closeClickEvent = document.createEvent('HTMLEvents');
    closeClickEvent.initEvent('click', true, true);
    closeHandle.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      this.onCandleDragStart(index, 'close', parseFloat(closeHandle.getAttribute('data-start-price') || '0'));
    });
    closeHandle.addEventListener('mousedown', (e: MouseEvent) => {
      e.stopPropagation();
      this.onCandleDragStart(index, 'close', parseFloat(closeHandle.getAttribute('data-start-price') || '0'));
    });

    group.appendChild(closeHandle);
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
      const price = this.chartMaxPrice - ((mouseY / this.chartHeightVal) * (this.chartMaxPrice - this.chartMinPrice));

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

  private drawCandleIndexes(svg: SVGSVGElement, group: SVGElement, width: number, height: number): void {
    const totalCandles = this.candles.length;
    if (totalCandles <= 1) return;

    // Use the same calculations as renderChart to align labels with candles
    const baseChartWidth = width - 40;
    const candleWidth = Math.max(2, baseChartWidth / totalCandles - 4);
    const candleSpacing = (baseChartWidth - candleWidth * totalCandles) / (totalCandles + 1);

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

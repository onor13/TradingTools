import {Component, ElementRef, EventEmitter, Input, Output, AfterViewInit, ViewChild, OnChanges, SimpleChanges} from '@angular/core';


export interface CandleData {
  open: number;
  close: number;
  low: number;
  high: number;
  direction: string;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

@Component({
  selector: 'app-editable-chart',
  templateUrl: './editable-chart.component.html',
  styleUrls: ['./editable-chart.component.css'],
  standalone: true
})
export class EditableChartComponent implements AfterViewInit, OnChanges {
  @Input() candles: CandleData[] = [];

  @Output() candleModified = new EventEmitter<CandleData>();

  @ViewChild('chartSvg', { static: false }) svgElement!: ElementRef<SVGSVGElement>;
  private resizeTimeout: number | null = null;

  ngAfterViewInit(): void {
    if (this.svgElement) {
      this.resizeSvg();
      this.setupResizeListener();
      if (this.candles && this.candles.length > 0) {
        this.renderChart();
      }
    }
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

    // Create SVG group for chart content
    const chartGroup = document.createElementNS(SVG_NS, 'g');
    chartGroup.setAttribute('transform', `translate(0, ${(height - chartHeight) / 2})`);
    svg.appendChild(chartGroup);

    // Draw grid lines and labels
    this.drawGrid(svg, chartGroup, width, height, minPrice, maxPrice, chartHeight);

    // Draw candles
    this.candles.forEach((candle, index) => {
      const x = candleSpacing + (index * (candleWidth + 4));
      this.drawCandle(svg, chartGroup, x, candle, minPrice, maxPrice, chartHeight, width, height, candleWidth, candleSpacing);
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
      text.textContent = price.toFixed(2);
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
    wick.setAttribute('stroke-width', '6');
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

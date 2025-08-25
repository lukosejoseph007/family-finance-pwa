<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import * as d3 from 'd3';
  import type { TrendPoint } from '$lib/types';
  
  export let data: TrendPoint[];
  export let currency: string = '₹';

  let svgElement: SVGSVGElement;
  let containerElement: HTMLDivElement;
  let tooltip: HTMLDivElement;

  function formatCurrency(value: number): string {
    return `${currency}${value.toLocaleString()}`;
  }

  function drawChart() {
    if (!svgElement || !data.length) return;

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = 900 - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    const svg = d3.select(svgElement)
      .attr('width', '100%')
      .attr('height', height + margin.top + margin.bottom)
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .html('');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scalePoint()
      .domain(data.map(d => d.month))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(d.income, d.expenses)) || 0])
      .range([height, 0]);

    // Add gridlines
    g.selectAll('.grid-line')
      .data(y.ticks(6))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .style('stroke', '#f1f5f9')
      .style('stroke-width', 1);

    // Create area generators
    const incomeArea = d3.area<TrendPoint>()
      .x(d => x(d.month)!)
      .y0(height)
      .y1(d => y(d.income))
      .curve(d3.curveCardinal);

    const expenseArea = d3.area<TrendPoint>()
      .x(d => x(d.month)!)
      .y0(height)
      .y1(d => y(d.expenses))
      .curve(d3.curveCardinal);

    // Create line generators
    const incomeLine = d3.line<TrendPoint>()
      .x(d => x(d.month)!)
      .y(d => y(d.income))
      .curve(d3.curveCardinal);

    const expenseLine = d3.line<TrendPoint>()
      .x(d => x(d.month)!)
      .y(d => y(d.expenses))
      .curve(d3.curveCardinal);

    const savingsLine = d3.line<TrendPoint>()
      .x(d => x(d.month)!)
      .y(d => y(d.savings))
      .curve(d3.curveCardinal);

    // Add areas
    g.append('path')
      .datum(data)
      .attr('fill', '#10B981')
      .attr('fill-opacity', 0.1)
      .attr('d', incomeArea);

    g.append('path')
      .datum(data)
      .attr('fill', '#EF4444')
      .attr('fill-opacity', 0.1)
      .attr('d', expenseArea);

    // Add lines
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#10B981')
      .attr('stroke-width', 3)
      .attr('d', incomeLine);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#EF4444')
      .attr('stroke-width', 3)
      .attr('d', expenseLine);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#3B82F6')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('d', savingsLine);

    // Add data points with interactions
    const pointData = [
      { key: 'income', color: '#10B981', label: 'Income' },
      { key: 'expenses', color: '#EF4444', label: 'Expenses' },
      { key: 'savings', color: '#3B82F6', label: 'Savings' }
    ];

    pointData.forEach(({ key, color, label }) => {
      g.selectAll(`.${key}-dot`)
        .data(data)
        .enter()
        .append('circle')
        .attr('class', `${key}-dot`)
        .attr('cx', d => x(d.month)!)
        .attr('cy', d => y(d[key as keyof TrendPoint] as number))
        .attr('r', 4)
        .style('fill', color)
        .style('stroke', '#fff')
        .style('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 6);
          
          // Show tooltip
          const value = d[key as keyof TrendPoint] as number;
          const tooltip = d3.select(containerElement)
            .select('.tooltip')
            .style('opacity', 1)
            .html(`
              <div class="tooltip-content">
                <div class="tooltip-title">${d.month} - ${label}</div>
                <div class="tooltip-value">${formatCurrency(value)}</div>
              </div>
            `);
            
          const [mouseX, mouseY] = d3.pointer(event, containerElement);
          tooltip
            .style('left', (mouseX + 10) + 'px')
            .style('top', (mouseY - 10) + 'px');
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 4);
            
          d3.select(containerElement)
            .select('.tooltip')
            .style('opacity', 0);
        });
    });

    // Add axes with styling
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#475569');

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y)
        .tickFormat(d => formatCurrency(d as number))
        .ticks(6))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#475569');

    // Style axis lines
    g.selectAll('.domain')
      .style('stroke', '#cbd5e1')
      .style('stroke-width', 1);

    g.selectAll('.tick line')
      .style('stroke', '#cbd5e1')
      .style('stroke-width', 1);
  }

  onMount(() => {
    drawChart();
  });

  afterUpdate(() => {
    drawChart();
  });
</script>

<div bind:this={containerElement} class="chart-container">
  <h2 class="chart-title">Monthly Trends</h2>
  <div class="chart-legend">
    <div class="legend-item-trend">
      <div class="legend-dot" style="background-color: #10B981"></div>
      <span>Income</span>
    </div>
    <div class="legend-item-trend">
      <div class="legend-dot" style="background-color: #EF4444"></div>
      <span>Expenses</span>
    </div>
    <div class="legend-item-trend">
      <div class="legend-dot" style="background-color: #3B82F6"></div>
      <span>Savings</span>
    </div>
  </div>
  <div class="chart-wrapper">
    <svg bind:this={svgElement} class="trend-chart" />
    <div class="tooltip">
      <div class="tooltip-content"></div>
    </div>
  </div>
</div>

<style>
  .chart-container {
    background: white;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    margin: 24px 0;
    position: relative;
  }

  .chart-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 24px;
    text-align: center;
    letter-spacing: -0.025em;
  }

  .chart-legend {
    display: flex;
    justify-content: center;
    gap: 32px;
    margin-bottom: 24px;
  }

  .legend-item-trend {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }

  .legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .chart-wrapper {
    position: relative;
    width: 100%;
  }

  .trend-chart {
    width: 100%;
    height: 390px;
    overflow: visible;
  }

  .tooltip {
    position: absolute;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    z-index: 10;
  }

  .tooltip-content {
    background: rgba(15, 23, 42, 0.95);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-size: 14px;
    min-width: 150px;
    backdrop-filter: blur(8px);
  }

  :global(.tooltip-title) {
    font-weight: 600;
    margin-bottom: 4px;
    color: #f8fafc;
  }

  :global(.tooltip-value) {
    font-size: 16px;
    font-weight: 700;
    color: #22c55e;
  }

  @media (max-width: 768px) {
    .chart-container {
      padding: 20px;
      margin: 16px 0;
    }
    
    .chart-title {
      font-size: 1.5rem;
      margin-bottom: 20px;
    }

    .chart-legend {
      gap: 16px;
      margin-bottom: 20px;
    }

    .legend-item-trend {
      font-size: 13px;
    }

    .trend-chart {
      height: 350px;
    }
  }

  @media (max-width: 640px) {
    .chart-container {
      padding: 16px;
    }
    
    .chart-legend {
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .trend-chart {
      height: 300px;
    }
  }
</style>
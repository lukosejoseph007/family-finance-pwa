<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import * as d3 from 'd3';
  import type { WaterfallItem } from '$lib/types';

  export let data: WaterfallItem[];
  export let width = 900;
  export let height = 400;
  export let currency = '₹';

  let svgElement: SVGSVGElement;
  let containerElement: HTMLDivElement;
  let tooltip: HTMLDivElement;
  
  let margin = { top: 40, right: 30, bottom: 60, left: 80 };
  
  // Derived dimensions
  $: innerWidth = width - margin.left - margin.right;
  $: innerHeight = height - margin.top - margin.bottom;

  function formatCurrency(value: number): string {
    return `${currency}${Math.abs(value).toLocaleString()}`;
  }

  function drawChart() {
    if (!svgElement || !data.length) return;

    const svg = d3.select(svgElement)
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .html('');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.name))
      .range([0, innerWidth])
      .padding(0.3);

    const maxValue = d3.max(data, d => Math.max(d.cumulative, Math.abs(d.value))) || 0;
    const yScale = d3.scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([innerHeight, 0]);

    // Add grid lines
    g.selectAll('.grid-line')
      .data(yScale.ticks(6))
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .style('stroke', '#f1f5f9')
      .style('stroke-width', 1);

    // Add bars with proper positioning
    const bars = g.selectAll('.waterfall-bar')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'waterfall-bar');

    bars.append('rect')
      .attr('x', d => xScale(d.name)!)
      .attr('y', d => {
        if (d.type === 'income') {
          return yScale(d.cumulative);
        } else if (d.type === 'net') {
          return yScale(d.cumulative);
        } else {
          return yScale(d.cumulative + Math.abs(d.value));
        }
      })
      .attr('width', xScale.bandwidth())
      .attr('height', d => {
        const barHeight = Math.abs(yScale(0) - yScale(Math.abs(d.value)));
        return Math.max(barHeight, 2); // Minimum height for visibility
      })
      .attr('fill', d => d.color)
      .style('cursor', 'pointer')
      .style('opacity', 0.9)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style('opacity', 1)
          .attr('transform', 'scale(1.02)');
        
        // Show tooltip
        const tooltip = d3.select(containerElement)
          .select('.tooltip')
          .style('opacity', 1)
          .html(`
            <div class="tooltip-content">
              <div class="tooltip-title">${d.name}</div>
              <div class="tooltip-value">${formatCurrency(d.value)}</div>
              <div class="tooltip-cumulative">Running Total: ${formatCurrency(d.cumulative)}</div>
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
          .style('opacity', 0.9)
          .attr('transform', 'scale(1)');
          
        d3.select(containerElement)
          .select('.tooltip')
          .style('opacity', 0);
      });

    // Add connecting lines between bars
    for (let i = 0; i < data.length - 1; i++) {
      const current = data[i];
      const next = data[i + 1];
      
      if (current.type !== 'net' && next.type !== 'income') {
        g.append('line')
          .attr('x1', xScale(current.name)! + xScale.bandwidth())
          .attr('y1', yScale(current.cumulative))
          .attr('x2', xScale(next.name)!)
          .attr('y2', yScale(current.cumulative))
          .style('stroke', '#64748b')
          .style('stroke-width', 2)
          .style('stroke-dasharray', '5,5')
          .style('opacity', 0.6);
      }
    }

    // Add value labels
    bars.append('text')
      .text(d => formatCurrency(d.value))
      .attr('x', d => xScale(d.name)! + xScale.bandwidth() / 2)
      .attr('y', d => {
        if (d.type === 'income') {
          return yScale(d.cumulative) - 8;
        } else if (d.type === 'net') {
          return yScale(d.cumulative) - 8;
        } else {
          return yScale(d.cumulative + Math.abs(d.value)) - 8;
        }
      })
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('fill', '#1e293b')
      .style('pointer-events', 'none');

    // Add axes with styling
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#475569')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale)
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
  <h2 class="chart-title">Cash Flow Waterfall</h2>
  <div class="chart-wrapper">
    <svg bind:this={svgElement} class="waterfall-chart" />
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
    margin-bottom: 32px;
    text-align: center;
    letter-spacing: -0.025em;
  }

  .chart-wrapper {
    position: relative;
    width: 100%;
  }

  .waterfall-chart {
    width: 100%;
    height: 400px;
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
    margin-bottom: 2px;
  }

  :global(.tooltip-cumulative) {
    font-size: 12px;
    color: #94a3b8;
  }

  @media (max-width: 768px) {
    .chart-container {
      padding: 20px;
      margin: 16px 0;
    }
    
    .chart-title {
      font-size: 1.5rem;
      margin-bottom: 24px;
    }

    .waterfall-chart {
      height: 350px;
    }
  }

  @media (max-width: 640px) {
    .chart-container {
      padding: 16px;
    }
    
    .waterfall-chart {
      height: 300px;
    }
  }
</style>
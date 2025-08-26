<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import * as d3 from 'd3';
  import type { PieCategory } from '$lib/types';
  
  export let data: PieCategory[];
  export let currency: string = '₹';
  export let height: number = 350;

  let svgElement: SVGSVGElement;
  let containerElement: HTMLDivElement;
  let tooltip: HTMLDivElement;

  function formatCurrency(value: number): string {
    return `${currency}${value.toLocaleString()}`;
  }

  function drawChart() {
    if (!svgElement || !data.length) return;

    const width = height; // Maintain square aspect ratio
    const radius = Math.min(width, height) / 2 - 20;

    const svg = d3.select(svgElement)
      .attr('width', width)
      .attr('height', height)
      .html('');

    const g = svg.append('g')
      .attr('transform', `translate(${width/2}, ${height/2})`);

    const pie = d3.pie<PieCategory>()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<PieCategory>>()
      .innerRadius(radius * 0.4)
      .outerRadius(radius);

    const hoverArc = d3.arc<d3.PieArcDatum<PieCategory>>()
      .innerRadius(radius * 0.4)
      .outerRadius(radius * 1.05);

    const arcs = g.selectAll('arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .style('opacity', 0.9)
      .style('stroke', '#fff')
      .style('stroke-width', 3)
      .style('cursor', 'pointer')
      .on('click', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style('opacity', 1)
          .attr('d', (datum) => hoverArc(datum as d3.PieArcDatum<PieCategory>));
        
        // Update fixed tooltip
        d3.select(containerElement)
          .select('.fixed-tooltip')
          .style('display', 'block')
          .style('opacity', 1)
          .style('visibility', 'visible')
          .html(`
            <div class="tooltip-content" style="--tooltip-color: ${d.data.color}; --tooltip-color-rgb: ${d.data.color.replace('#', '').padEnd(6, d.data.color.replace('#', '')).match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(',')}">
              <div class="tooltip-title">${d.data.name}</div>
              <div class="tooltip-value">${formatCurrency(d.data.value)}</div>
              <div class="tooltip-percentage">${d.data.percentage.toFixed(2)}% of total</div>
            </div>
          `);
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style('opacity', 0.9)
          .attr('d', (datum) => arc(datum as d3.PieArcDatum<PieCategory>));
          
        d3.select(containerElement)
          .select('.tooltip')
          .style('opacity', 0);
      });

    // Add percentage labels on slices
    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('dy', '0.35em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('fill', '#fff')
      .style('paint-order', 'stroke fill')
      .style('stroke', '#000')
      .style('stroke-width', '1px')
      .style('stroke-linecap', 'round')
      .style('stroke-linejoin', 'round')
      .text(d => d.data.percentage >= 5 ? `${d.data.percentage.toFixed(2)}%` : '');
  }

  onMount(() => {
    drawChart();
  });

  afterUpdate(() => {
    drawChart();
  });
</script>

<div bind:this={containerElement} class="chart-container">
  <h2 class="chart-title">Expense Breakdown</h2>
  <div class="fixed-tooltip" style="display: none; opacity: 0; visibility: hidden;">
    <div class="tooltip-container">
      <div class="tooltip-content"></div>
    </div>
  </div>
  <div class="pie-container">
    <div class="pie-chart-wrapper">
      <svg bind:this={svgElement} class="pie-chart" viewBox="0 0 350 350" preserveAspectRatio="xMidYMid meet" />
    </div>
    <div class="pie-legend">
      {#each data as category, index}
        <div class="legend-item">
          <div class="legend-info">
            <div class="legend-color" style="background-color: {category.color}"></div>
            <span class="legend-name">{category.name}</span>
          </div>
          <div class="legend-values">
            <span class="legend-value">{formatCurrency(category.value)}</span>
            <span class="legend-percent">({category.percentage.toFixed(2)}%)</span>
          </div>
        </div>
      {/each}
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

  .pie-container {
    display: flex;
    gap: 48px;
    align-items: center;
    justify-content: center;
  }

  .pie-chart-wrapper {
    position: relative;
    flex-shrink: 0;
    max-width: 100%;
  }

  .pie-chart {
    overflow: visible;
  }

  .pie-legend {
    flex: 1;
    max-width: 300px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #f1f5f9;
    transition: background-color 0.2s ease;
  }

  .legend-item:hover {
    background-color: #f8fafc;
    margin: 0 -16px;
    padding-left: 16px;
    padding-right: 16px;
    border-radius: 8px;
  }

  .legend-item:last-child {
    border-bottom: none;
  }

  .legend-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .legend-color {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .legend-name {
    font-weight: 600;
    color: #374151;
    font-size: 14px;
  }

  .legend-values {
    text-align: right;
  }

  .legend-value {
    font-weight: 700;
    color: #1f2937;
    font-size: 14px;
    display: block;
  }

  .legend-percent {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
  }

  .fixed-tooltip {
    position: static;
    width: 100%;
    text-align: center;
    margin-bottom: 20px;
    min-height: 60px;
    opacity: 0;
    display: none;
    transition: opacity 0.2s ease-in-out, visibility 0.2s;
    pointer-events: none;
    visibility: hidden;
  }

  .fixed-tooltip {
    position: relative;
    z-index: 1000;
    padding: 8px 0;
  }

  .tooltip-content {
    display: inline-block;
    margin: 0 auto;
    padding: 12px 24px;
    border-radius: 8px;
    background-color: var(--tooltip-color);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    color: initial; /* Reset inherited text color */
  }

  :global(.fixed-tooltip .tooltip-content .tooltip-title) {
    font-weight: 700;
    margin-bottom: 6px;
    color: #000 !important;
    font-size: 15px;
  }

  :global(.fixed-tooltip .tooltip-content .tooltip-value) {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 2px;
    color: #111827 !important;
  }

  :global(.fixed-tooltip .tooltip-content .tooltip-percentage) {
    font-size: 12px;
    opacity: 0.9;
    color: #4b5563 !important;
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

    .pie-container {
      flex-direction: column;
      gap: 32px;
    }

    .pie-legend {
      max-width: none;
      width: 100%;
    }
  }

  @media (max-width: 640px) {
    .chart-container {
      padding: 16px;
    }
    
    .pie-container {
      gap: 24px;
    }

    .legend-item {
      padding: 10px 0;
    }

    .legend-name {
      font-size: 13px;
    }

    .legend-value {
      font-size: 13px;
    }
  }

</style>
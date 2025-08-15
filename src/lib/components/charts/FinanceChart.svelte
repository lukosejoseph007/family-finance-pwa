<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart as ChartJS } from 'chart.js';

  export let type: 'line' | 'bar' | 'doughnut' = 'line';
  export let data: any;
  export let title = '';
  export let height = '400px';
  
  let canvas: HTMLCanvasElement;
  let chart: ChartJS | null = null;

  onMount(() => {
    if (canvas && data) {
      createChart();
    }

    return () => {
      if (chart) {
        chart.destroy();
      }
    };
  });

  function createChart() {
    if (chart) {
      chart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: Boolean(title),
          text: title,
          font: {
            size: 16,
            weight: 'bold' as const
          }
        },
        legend: {
          position: 'top' as const
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff'
        }
      },
      scales: type === 'doughnut' ? undefined : {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value: unknown) {
              return '$' + (value as number).toLocaleString();
            }
          }
        }
      }
    };

    chart = new ChartJS(ctx, {
      type: type as any,
      data,
      options
    });
  }

  // Reactive update when data changes
  $: if (chart && data) {
    chart.data = data;
    chart.update();
  }
</script>

{#if title}
  <div class="mb-4">
    <h3 class="text-lg font-semibold text-gray-900">{title}</h3>
  </div>
{/if}

<div class="chart-container" style="height: {height}; position: relative;">
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .chart-container {
    background: white;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
</style>
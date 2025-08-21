<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import {
		Chart as ChartJS,
		CategoryScale,
		LinearScale,
		PointElement,
		LineElement,
		BarElement,
		Title,
		Tooltip,
		Legend,
		ArcElement,
		LineController,
		BarController,
		DoughnutController
	} from 'chart.js';
	import type {
		FinanceChartData,
		FinanceChartOptions,
		TooltipLabelContext
	} from '../../../declarations';

	// Register Chart.js components and controllers
	ChartJS.register(
		CategoryScale,
		LinearScale,
		PointElement,
		LineElement,
		BarElement,
		Title,
		Tooltip,
		Legend,
		ArcElement,
		LineController,
		BarController,
		DoughnutController
	);

	let {
		type = 'line',
		data,
		title = '',
		height = '400px'
	} = $props<{
		type?: 'line' | 'bar' | 'doughnut';
		data: FinanceChartData;
		title?: string;
		height?: string;
	}>();

	let canvas: HTMLCanvasElement;
	let chart: ChartJS | null = null;

	onMount(() => {
		return () => {
			if (chart) {
				chart.destroy();
			}
		};
	});

	// Use $effect to handle chart creation and updates
	$effect(() => {
		if (canvas && data) {
			createChart();
		}
	});

	function createChart() {
		if (chart) {
			chart.destroy();
		}

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const options: FinanceChartOptions = {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				title: {
					display: Boolean(title),
					text: title,
					font: {
						size: 16,
						weight: 'bold'
					}
				},
				legend: {
					position: 'top'
				},
				tooltip: {
					backgroundColor: 'rgba(0, 0, 0, 0.8)',
					titleColor: '#ffffff',
					bodyColor: '#ffffff',
					borderColor: '#374151',
					borderWidth: 1,
					cornerRadius: 8,
					callbacks: {
						label: function (context: TooltipLabelContext) {
							const value = context.parsed.y || context.parsed;
							return `${context.dataset.label || context.label}: $${value.toLocaleString()}`;
						}
					}
				}
			}
		};

		// Add scales for non-doughnut charts
		if (type !== 'doughnut') {
			options.scales = {
				y: {
					beginAtZero: true,
					grid: {
						color: '#E5E7EB'
					},
					ticks: {
						callback: function (value: string | number) {
							return '$' + value.toLocaleString();
						}
					}
				},
				x: {
					grid: {
						color: '#E5E7EB'
					}
				}
			};
		} else {
			// Doughnut specific options
			options.cutout = '60%';
			if (options.plugins && options.plugins.legend) {
				options.plugins.legend.position = 'right';
			}
		}

		// Line chart specific styling
		if (type === 'line') {
			options.elements = {
				line: {
					tension: 0.1,
					borderWidth: 2
				},
				point: {
					radius: 4,
					hoverRadius: 6
				}
			};
		}

		// Bar chart specific styling
		if (type === 'bar') {
			options.elements = {
				bar: {
					borderRadius: 4
				}
			};
		}

		// Create a deep copy of data to avoid Svelte 5 reactivity issues
		const chartData = untrack(() => JSON.parse(JSON.stringify(data)));

		chart = new ChartJS(ctx, {
			type: type,
			data: chartData,
			options
		});
	}

	// Update chart when data changes
	$effect(() => {
		if (chart && data) {
			// Create a deep copy to avoid reactivity issues
			const newData = untrack(() => JSON.parse(JSON.stringify(data)));
			chart.data = newData;
			chart.update('none'); // Use 'none' animation for better performance
		}
	});
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

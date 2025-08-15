<script lang="ts">
	import { onMount } from 'svelte';
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

		const options: any = {
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
						label: function (context: any) {
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
						callback: function (value: any) {
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
			options.plugins.legend.position = 'right';
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

		chart = new ChartJS(ctx, {
			type: type,
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

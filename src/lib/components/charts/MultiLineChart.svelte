<script lang="ts">
	import { Chart, Line } from 'layerchart';
	import { formatCurrency } from '$lib/utils/currency';

	interface DataPoint {
		x: string;
		y: number;
	}

	interface SeriesData {
		label: string;
		color: string;
		data: DataPoint[];
	}

	interface ChartProps {
		data: {
			series: SeriesData[];
		};
		currency?: string;
		height?: number;
		title?: string;
		showTooltip?: boolean;
		showLegend?: boolean;
	}

	let {
		data,
		currency = 'INR',
		height = 300,
		title,
		showTooltip = true,
		showLegend = true
	}: ChartProps = $props();

	// Transform data for LayerChart
	const chartData = $derived(() => {
		if (!data || !data.series || data.series.length === 0) return [];
		
		// Get all unique x values (dates/periods)
		const allXValues = [...new Set(
			data.series.flatMap(series => series.data.map(point => point.x))
		)].sort();
		
		// Transform to LayerChart format: array of objects with x and series values
		return allXValues.map(x => {
			const point: Record<string, string | number> = { x };
			data.series.forEach(series => {
				const dataPoint = series.data.find(d => d.x === x);
				point[series.label] = dataPoint ? dataPoint.y : 0;
			});
			return point;
		});
	});

	const formatValue = (value: number) => formatCurrency(value, currency);
	const seriesKeys = $derived(() => data?.series ? data.series.map(s => s.label) : []);
	const seriesColors = $derived(() => data?.series ? data.series.map(s => s.color) : []);
</script>

<div class="w-full" style="height: {height}px;">
	{#if title}
		<h3 class="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
	{/if}
	
	{#if chartData().length === 0}
		<div class="flex h-full items-center justify-center">
			<div class="text-center">
				<div class="text-4xl mb-4">📈</div>
				<p class="text-gray-500">No data available</p>
			</div>
		</div>
	{:else}
		<div class="h-full">
			<Chart 
				data={chartData()} 
				x="x"
				y={seriesKeys}
				padding={{ top: 20, right: 20, bottom: 60, left: 60 }}
				let:width
				let:height
				let:containerWidth
				let:containerHeight
			>
				{#each seriesKeys() as key, index}
					<Line
						y={key}
						stroke={seriesColors()[index]}
						strokeWidth={2}
						class="transition-all duration-200 hover:stroke-width-3"
					/>
				{/each}

				<!-- Tooltip temporarily disabled due to LayerChart compatibility -->
			</Chart>

			<!-- Legend -->
			{#if showLegend && data.series.length > 0}
				<div class="mt-4 flex flex-wrap items-center justify-center gap-4">
					{#each data.series as series}
						<div class="flex items-center space-x-2">
							<div 
								class="w-4 h-4 rounded-full" 
								style="background-color: {series.color}"
							></div>
							<span class="text-sm font-medium text-gray-700">{series.label}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
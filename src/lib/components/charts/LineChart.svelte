<script lang="ts">
	import { Chart, Line } from 'layerchart';
	import { formatCurrency } from '$lib/utils/currency';

	interface DataPoint {
		date: string | Date;
		[key: string]: number | string | Date;
	}

	interface ChartProps {
		data: DataPoint[];
		xKey: string;
		yKeys: string[];
		colors?: string[];
		currency?: string;
		height?: number;
		title?: string;
		showGrid?: boolean;
		showTooltip?: boolean;
		animated?: boolean;
	}

	let {
		data,
		xKey,
		yKeys,
		colors = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b'],
		currency = 'INR',
		height = 300,
		title,
		showGrid = true,
		showTooltip = true,
		animated = true
	}: ChartProps = $props();

	// Transform data for LayerChart
	const chartData = $derived(() => {
		if (!data || data.length === 0) return [];
		
		return data.map((item: DataPoint) => ({
			...item,
			[xKey]: typeof item[xKey] === 'string' ? new Date(item[xKey]) : item[xKey]
		}));
	});

	// Format functions
	const formatDate = (date: Date) => {
		return date.toLocaleDateString('en-IN', {
			month: 'short',
			day: 'numeric',
			year: chartData().length > 31 ? 'numeric' : undefined
		});
	};

	const formatValue = (value: number) => formatCurrency(value, currency);
</script>

<div class="w-full" style="height: {height}px;">
	{#if title}
		<h3 class="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
	{/if}
	
	{#if chartData.length === 0}
		<div class="flex h-full items-center justify-center">
			<div class="text-center">
				<div class="text-4xl mb-4">📈</div>
				<p class="text-gray-500">No data available</p>
			</div>
		</div>
	{:else}
		<Chart
			data={chartData}
			x={xKey}
			y={yKeys}
			padding={{ top: 20, right: 20, bottom: 40, left: 60 }}
		>
			{#each yKeys as key, index}
				<Line
					y={key}
					stroke={colors[index % colors.length]}
					strokeWidth={2}
				/>
			{/each}
		</Chart>
	{/if}
</div>
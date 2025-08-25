<script lang="ts">
	import { Chart, Bar } from 'layerchart';
	import { formatCurrency } from '$lib/utils/currency';

	interface DataPoint {
		category: string;
		[key: string]: string | number;
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
		stacked?: boolean;
		horizontal?: boolean;
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
		stacked = false,
		horizontal = false
	}: ChartProps = $props();

	// Transform data for LayerChart
	const chartData = $derived(() => {
		if (!data || !Array.isArray(data)) {
			return [];
		}

		return data
			return data
			.filter(item => {
				if (!item || typeof item !== 'object' || !item.hasOwnProperty(xKey) || item[xKey] == null) {
					return false;
				}

				const hasAllYKeys = yKeys.every(key => item.hasOwnProperty(key));
				if (!hasAllYKeys) {
					return false;
				}

				return yKeys.some(key => {
					const value = Number(item[key]);
					return !isNaN(value) && value > 0;
				});
			})
			.map(item => {
				if (!item) return undefined;
				const sanitizedItem: { [key: string]: any } = {
					[xKey]: item[xKey]
				};
				yKeys.forEach(key => {
					sanitizedItem[key] = Number(item[key]) || 0;
				});
				return sanitizedItem as DataPoint;
			})
			.filter(item => item !== undefined);
	});

	const formatValue = (value: number) => formatCurrency(value, currency);
</script>

<div class="w-full" style="height: {height}px;">
	{#if title}
		<h3 class="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
	{/if}
	
	{#if chartData.length === 0}
		<div class="flex h-full items-center justify-center">
			<div class="text-center">
				<div class="text-4xl mb-4">📊</div>
				<p class="text-gray-500">No data available</p>
			</div>
		</div>
	{:else}
		<Chart
			data={chartData}
			x={xKey}
			y={yKeys}
			padding={{ top: 20, right: 20, bottom: 60, left: 80 }}
		>
			{#each yKeys as key, index}
				<Bar
					y={key}
					fill={colors[index % colors.length]}
					rx={2}
				/>
			{/each}
		</Chart>

		<!-- Legend -->
		<div class="mt-4 flex flex-wrap gap-4 justify-center">
			{#each yKeys as key, index}
				<div class="flex items-center gap-2">
					<div 
						class="w-3 h-3 rounded-full" 
						style="background-color: {colors[index % colors.length]}"
					></div>
					<span class="text-sm font-medium text-gray-700 capitalize">{key}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
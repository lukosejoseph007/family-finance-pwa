<script lang="ts">
	import { formatCurrency } from '$lib/utils/currency';

	export let budgeted: number;
	export let spent: number;
	export let categoryName: string;
	export let showLabels = true;
	export let showPercentage = true;
	export let compact = false;

	$: available = budgeted - spent;
	$: percentage = budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0;
	$: status = getStatus(percentage, available);

	function getStatus(percentage: number, available: number) {
		if (available < 0) return 'overspent';
		if (percentage >= 90) return 'warning';
		if (percentage >= 70) return 'caution';
		return 'good';
	}

	function getProgressColor(status: string) {
		switch (status) {
			case 'overspent':
				return 'bg-red-500';
			case 'warning':
				return 'bg-orange-500';
			case 'caution':
				return 'bg-yellow-500';
			default:
				return 'bg-green-500';
		}
	}

	function getBackgroundColor(status: string) {
		switch (status) {
			case 'overspent':
				return 'bg-red-50 border-red-200';
			case 'warning':
				return 'bg-orange-50 border-orange-200';
			case 'caution':
				return 'bg-yellow-50 border-yellow-200';
			default:
				return 'bg-green-50 border-green-200';
		}
	}

	function getTextColor(status: string) {
		switch (status) {
			case 'overspent':
				return 'text-red-700';
			case 'warning':
				return 'text-orange-700';
			case 'caution':
				return 'text-yellow-700';
			default:
				return 'text-green-700';
		}
	}
</script>

<div class="rounded-lg border p-4 {getBackgroundColor(status)} {compact ? 'p-2' : ''}">
	{#if showLabels && !compact}
		<div class="mb-2 flex items-center justify-between">
			<h4 class="font-medium text-gray-900">{categoryName}</h4>
			{#if showPercentage}
				<span class="text-sm font-medium {getTextColor(status)}">
					{percentage.toFixed(0)}%
				</span>
			{/if}
		</div>
	{/if}

	<div class="space-y-2">
		{#if showLabels}
			<div class="flex justify-between text-sm">
				<span class="text-gray-600">
					{compact ? '' : 'Spent: '}{formatCurrency(spent)}
				</span>
				<span class="text-gray-600">
					{compact ? '' : 'Budget: '}{formatCurrency(budgeted)}
				</span>
			</div>
		{/if}

		<!-- Progress Bar -->
		<div class="relative">
			<div class="h-2 w-full rounded-full bg-gray-200 {compact ? 'h-1' : ''}">
				<div
					class="h-full rounded-full transition-all duration-300 {getProgressColor(status)}"
					style="width: {Math.min(percentage, 100)}%"
				></div>

				<!-- Overspent indicator -->
				{#if percentage > 100}
					<div
						class="absolute top-0 right-0 h-full rounded-r-full bg-red-600 opacity-75"
						style="width: {Math.min(percentage - 100, 20)}%"
					></div>
				{/if}
			</div>
		</div>

		{#if showLabels && !compact}
			<div class="flex items-center justify-between text-xs">
				<span class={getTextColor(status)}>
					{available >= 0 ? 'Remaining' : 'Overspent'}:
					{formatCurrency(Math.abs(available))}
				</span>

				{#if status === 'overspent'}
					<span class="font-medium text-red-600">Over Budget!</span>
				{:else if status === 'warning'}
					<span class="font-medium text-orange-600">Almost Spent</span>
				{:else if status === 'caution'}
					<span class="font-medium text-yellow-600">Watch Spending</span>
				{:else}
					<span class="font-medium text-green-600">On Track</span>
				{/if}
			</div>
		{/if}
	</div>
</div>

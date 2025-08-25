<script lang="ts">
	import { ProgressRing } from '$lib/components';
	import { formatCurrency } from '$lib/utils/currency';

	let {
		type = 'financial-health',
		title = 'Financial Health',
		data = {},
		currency = 'INR',
		className = ''
	} = $props<{
		type?: 'financial-health' | 'spending-trends' | 'savings-goal' | 'budget-alert';
		title?: string;
		data?: any;
		currency?: string;
		className?: string;
	}>();

	const getHealthScore = $derived(() => {
		if (type !== 'financial-health') return 0;
		const { income = 0, expenses = 0, savings = 0 } = data;
		
		if (income === 0) return 0;
		
		const savingsRate = (savings / income) * 100;
		const expenseRatio = (expenses / income) * 100;
		
		let score = 100;
		
		// Deduct points for high expense ratio
		if (expenseRatio > 80) score -= 30;
		else if (expenseRatio > 60) score -= 15;
		
		// Add points for good savings rate
		if (savingsRate >= 20) score += 0; // Already good
		else if (savingsRate >= 10) score -= 10;
		else score -= 25;
		
		return Math.max(0, Math.min(100, score));
	});

	const getHealthColor = $derived(() => {
		const score = getHealthScore();
		if (score >= 80) return '#10b981'; // green
		if (score >= 60) return '#f59e0b'; // yellow
		return '#ef4444'; // red
	});

	const getHealthMessage = $derived(() => {
		const score = getHealthScore();
		if (score >= 80) return 'Excellent financial health! Keep it up.';
		if (score >= 60) return 'Good progress. Consider increasing savings.';
		return 'Focus on reducing expenses and building savings.';
	});

	const getSpendingTrend = $derived(() => {
		if (type !== 'spending-trends') return { trend: 'stable', percentage: 0 };
		const { thisMonth = 0, lastMonth = 0 } = data;
		
		if (lastMonth === 0) return { trend: 'new', percentage: 0 };
		
		const change = ((thisMonth - lastMonth) / lastMonth) * 100;
		
		if (Math.abs(change) < 5) return { trend: 'stable', percentage: change };
		if (change > 0) return { trend: 'increase', percentage: change };
		return { trend: 'decrease', percentage: Math.abs(change) };
	});
</script>

<div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-xl sm:p-6 {className}">
	{#if type === 'financial-health'}
		<div class="flex items-center justify-between mb-4">
			<div>
				<h3 class="text-lg font-semibold text-gray-900">{title}</h3>
				<p class="text-sm text-gray-600">Overall financial wellness</p>
			</div>
			<div class="flex items-center space-x-2">
				<ProgressRing
					value={getHealthScore()}
					max={100}
					size={60}
					strokeWidth={5}
					color={getHealthColor()}
					showValue={true}
					animated={true}
				/>
			</div>
		</div>
		
		<div class="space-y-3">
			<p class="text-sm text-gray-700">{getHealthMessage()}</p>
			
			<div class="grid grid-cols-2 gap-3 text-sm">
				<div class="bg-blue-50 rounded-lg p-3">
					<div class="font-medium text-blue-900">Income</div>
					<div class="text-blue-700">{formatCurrency(data.income || 0, currency)}</div>
				</div>
				<div class="bg-red-50 rounded-lg p-3">
					<div class="font-medium text-red-900">Expenses</div>
					<div class="text-red-700">{formatCurrency(data.expenses || 0, currency)}</div>
				</div>
			</div>
			
			{#if data.savings !== undefined}
				<div class="bg-green-50 rounded-lg p-3">
					<div class="flex justify-between items-center">
						<span class="text-sm font-medium text-green-900">Monthly Savings</span>
						<span class="text-sm font-bold text-green-700">{formatCurrency(data.savings, currency)}</span>
					</div>
				</div>
			{/if}
		</div>

	{:else if type === 'spending-trends'}
		<div class="flex items-center justify-between mb-4">
			<div>
				<h3 class="text-lg font-semibold text-gray-900">{title}</h3>
				<p class="text-sm text-gray-600">Monthly spending comparison</p>
			</div>
			<div class="flex items-center space-x-2">
				{#if getSpendingTrend().trend === 'increase'}
					<div class="rounded-full bg-red-100 p-2">
						<svg class="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 17l9.2-9.2M17 17V7m0 10H7"/>
						</svg>
					</div>
				{:else if getSpendingTrend().trend === 'decrease'}
					<div class="rounded-full bg-green-100 p-2">
						<svg class="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7l9.2 9.2M17 7v10m0-10H7"/>
						</svg>
					</div>
				{:else}
					<div class="rounded-full bg-blue-100 p-2">
						<svg class="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
						</svg>
					</div>
				{/if}
			</div>
		</div>
		
		<div class="space-y-3">
			<div class="grid grid-cols-2 gap-3 text-sm">
				<div class="bg-gray-50 rounded-lg p-3">
					<div class="font-medium text-gray-700">Last Month</div>
					<div class="text-gray-900">{formatCurrency(data.lastMonth || 0, currency)}</div>
				</div>
				<div class="bg-blue-50 rounded-lg p-3">
					<div class="font-medium text-blue-700">This Month</div>
					<div class="text-blue-900">{formatCurrency(data.thisMonth || 0, currency)}</div>
				</div>
			</div>
			
			<div class="flex items-center justify-between text-sm">
				<span class="font-medium text-gray-700">Change:</span>
				<span class="font-bold {getSpendingTrend().trend === 'increase' ? 'text-red-600' : getSpendingTrend().trend === 'decrease' ? 'text-green-600' : 'text-blue-600'}">
					{getSpendingTrend().trend === 'increase' ? '+' : getSpendingTrend().trend === 'decrease' ? '-' : ''}
					{getSpendingTrend().percentage.toFixed(1)}%
				</span>
			</div>
		</div>

	{:else if type === 'budget-alert'}
		<div class="flex items-center justify-between mb-4">
			<div>
				<h3 class="text-lg font-semibold text-gray-900">{title}</h3>
				<p class="text-sm text-gray-600">Budget status alerts</p>
			</div>
			<div class="rounded-full bg-orange-100 p-2">
				<svg class="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"/>
				</svg>
			</div>
		</div>
		
		<div class="space-y-3">
			{#if data.overBudgetCategories && data.overBudgetCategories.length > 0}
				<div class="bg-red-50 border border-red-200 rounded-lg p-3">
					<div class="font-medium text-red-900 mb-2">Over Budget</div>
					{#each data.overBudgetCategories.slice(0, 2) as category}
						<div class="flex justify-between text-sm text-red-700">
							<span>{category.name}</span>
							<span>{((category.spent / category.budget) * 100).toFixed(0)}%</span>
						</div>
					{/each}
				</div>
			{/if}
			
			{#if data.nearLimitCategories && data.nearLimitCategories.length > 0}
				<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
					<div class="font-medium text-yellow-900 mb-2">Near Limit</div>
					{#each data.nearLimitCategories.slice(0, 2) as category}
						<div class="flex justify-between text-sm text-yellow-700">
							<span>{category.name}</span>
							<span>{((category.spent / category.budget) * 100).toFixed(0)}%</span>
						</div>
					{/each}
				</div>
			{/if}
			
			{#if (!data.overBudgetCategories || data.overBudgetCategories.length === 0) && (!data.nearLimitCategories || data.nearLimitCategories.length === 0)}
				<div class="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
					<div class="font-medium text-green-900">All budgets on track!</div>
					<div class="text-sm text-green-700">Great job managing your spending.</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
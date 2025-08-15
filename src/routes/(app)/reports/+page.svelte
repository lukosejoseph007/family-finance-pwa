<script lang="ts">
	import { onMount } from 'svelte';
	import { Card, FinanceChart } from '$lib/components';
	import { formatCurrency } from '$lib/utils/currency';
	import {
		getMonthlyReport,
		getCategorySpendingReport,
		getNetWorthTrend,
		getBudgetPerformance,
		getSpendingTrends
	} from '$lib/services/reportingService';
	import type {
		MonthlyReport,
		CategorySpendingReport,
		NetWorthTrend,
		SpendingTrend
	} from '$lib/services/reportingService';

	// State variables
	let monthlyReport = $state<MonthlyReport | null>(null);
	let categorySpending = $state<CategorySpendingReport[]>([]);
	let netWorthTrends = $state<NetWorthTrend[]>([]);
	let spendingTrends = $state<SpendingTrend[]>([]);
	let budgetPerformance = $state<{
		on_track_categories: number;
		over_budget_categories: number;
		under_budget_categories: number;
		total_variance: number;
		performance_score: number;
	} | null>(null);
	let loading = $state(true);
	let selectedMonth = $state(getCurrentMonth());

	function getCurrentMonth(): string {
		const now = new Date();
		return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
	}

	// Derived chart data
	const categoryChartData = $derived(() => {
		if (!categorySpending.length) return null;
		
		return {
			labels: categorySpending.map(cat => cat.category_name),
			datasets: [{
				label: 'Spent Amount',
				data: categorySpending.map(cat => cat.spent_amount),
				backgroundColor: [
					'#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6',
					'#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f59e0b'
				],
				borderWidth: 1
			}]
		};
	});

	const netWorthChartData = $derived(() => {
		if (!netWorthTrends.length) return null;
		
		return {
			labels: netWorthTrends.map(trend => {
				const date = new Date(trend.date);
				return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
			}),
			datasets: [
				{
					label: 'Assets',
					data: netWorthTrends.map(trend => trend.assets),
					borderColor: '#22c55e',
					backgroundColor: 'rgba(34, 197, 94, 0.1)',
					tension: 0.3
				},
				{
					label: 'Liabilities',
					data: netWorthTrends.map(trend => trend.liabilities),
					borderColor: '#ef4444',
					backgroundColor: 'rgba(239, 68, 68, 0.1)',
					tension: 0.3
				},
				{
					label: 'Net Worth',
					data: netWorthTrends.map(trend => trend.net_worth),
					borderColor: '#3b82f6',
					backgroundColor: 'rgba(59, 130, 246, 0.1)',
					tension: 0.3,
					borderWidth: 3
				}
			]
		};
	});

	const spendingTrendsChartData = $derived(() => {
		if (!spendingTrends.length) return null;
		
		// Group spending trends by category type
		const categoryTypes = [...new Set(spendingTrends.map(trend => trend.category_type))];
		const months = [...new Set(spendingTrends.map(trend => trend.month_year))].sort();
		
		const datasets = categoryTypes.map((categoryType, index) => {
			const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
			const color = colors[index % colors.length];
			
			return {
				label: categoryType.charAt(0).toUpperCase() + categoryType.slice(1),
				data: months.map(month => {
					const trend = spendingTrends.find(t => 
						t.month_year === month && t.category_type === categoryType
					);
					return trend ? trend.amount : 0;
				}),
				borderColor: color,
				backgroundColor: color + '20',
				tension: 0.3
			};
		});

		return {
			labels: months.map(month => {
				const [year, monthNum] = month.split('-');
				const date = new Date(parseInt(year), parseInt(monthNum) - 1);
				return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
			}),
			datasets
		};
	});

	async function loadReports() {
		try {
			loading = true;
			
			// Load all reports in parallel
			const [monthly, category, netWorth, spending, budget] = await Promise.all([
				getMonthlyReport(selectedMonth),
				getCategorySpendingReport(selectedMonth),
				getNetWorthTrend(),
				getSpendingTrends(),
				getBudgetPerformance(selectedMonth)
			]);

			monthlyReport = monthly;
			categorySpending = category;
			netWorthTrends = netWorth;
			spendingTrends = spending;
			budgetPerformance = budget;
		} catch (error) {
			console.error('Error loading reports:', error);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadReports();
	});

	// Watch for month changes
	$effect(() => {
		if (selectedMonth) {
			loadReports();
		}
	});
</script>

<svelte:head>
	<title>Financial Reports - Family Finance Tracker</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50">
	<!-- Professional Header Section -->
	<div class="relative overflow-hidden">
		<!-- Background Pattern -->
		<div class="absolute inset-0 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-700"></div>
		<div class="absolute inset-0 bg-black/10"></div>
		<div class="absolute inset-0" style="background-image: radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)"></div>
		
		<div class="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
				<div class="flex-1">
					<div class="flex items-center space-x-3 mb-4">
						<div class="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
							<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</div>
						<div>
							<h1 class="text-3xl sm:text-4xl font-bold text-white">Financial Reports</h1>
							<p class="text-teal-100 text-base sm:text-lg opacity-90 mt-1">
								Comprehensive analysis of your family's financial health
							</p>
						</div>
					</div>
				</div>
				
				<div class="flex-shrink-0">
					<div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
						<label for="month-select" class="block text-sm font-medium text-white/90 mb-2">
							Report Month
						</label>
						<select
							id="month-select"
							bind:value={selectedMonth}
							class="block rounded-lg border-gray-300 px-3 py-2 text-sm min-w-[180px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							{#each Array.from({length: 12}, (_, i) => {
								const date = new Date();
								date.setMonth(date.getMonth() - i);
								const value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
								const label = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
								return { value, label };
							}) as month}
								<option value={month.value}>{month.label}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Content Section -->
	<div class="relative">
		<div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-12 space-y-6">

	{#if loading}
		<div class="flex items-center justify-center h-64">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<span class="ml-2 text-gray-600">Loading reports...</span>
		</div>
	{:else}
		<!-- Monthly Overview Cards -->
		{#if monthlyReport}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card class="p-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-600">Total Income</p>
							<p class="text-2xl font-bold text-green-600">
								{formatCurrency(monthlyReport.income)}
							</p>
						</div>
						<div class="p-3 bg-green-100 rounded-full">
							<svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
							</svg>
						</div>
					</div>
				</Card>

				<Card class="p-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-600">Total Expenses</p>
							<p class="text-2xl font-bold text-red-600">
								{formatCurrency(monthlyReport.expenses)}
							</p>
						</div>
						<div class="p-3 bg-red-100 rounded-full">
							<svg class="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clip-rule="evenodd" />
							</svg>
						</div>
					</div>
				</Card>

				<Card class="p-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-600">Net Savings</p>
							<p class="text-2xl font-bold {monthlyReport.net_amount >= 0 ? 'text-green-600' : 'text-red-600'}">
								{formatCurrency(monthlyReport.net_amount)}
							</p>
						</div>
						<div class="p-3 {monthlyReport.net_amount >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-full">
							<svg class="w-6 h-6 {monthlyReport.net_amount >= 0 ? 'text-green-600' : 'text-red-600'}" fill="currentColor" viewBox="0 0 20 20">
								<path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clip-rule="evenodd" />
							</svg>
						</div>
					</div>
				</Card>

				<Card class="p-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-600">Savings Rate</p>
							<p class="text-2xl font-bold {(monthlyReport.net_amount / (monthlyReport.income || 1)) * 100 >= 20 ? 'text-green-600' : (monthlyReport.net_amount / (monthlyReport.income || 1)) * 100 >= 10 ? 'text-yellow-600' : 'text-red-600'}">
								{((monthlyReport.net_amount / (monthlyReport.income || 1)) * 100).toFixed(1)}%
							</p>
						</div>
						<div class="p-3 bg-blue-100 rounded-full">
							<svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd" />
								<path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
							</svg>
						</div>
					</div>
				</Card>
			</div>
		{/if}

		<!-- Budget Performance -->
		{#if budgetPerformance}
			<Card class="p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">Budget Performance Overview</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
					<div class="text-center">
						<div class="text-3xl font-bold text-green-600">{budgetPerformance.on_track_categories}</div>
						<div class="text-sm text-gray-600">On Track</div>
					</div>
					<div class="text-center">
						<div class="text-3xl font-bold text-red-600">{budgetPerformance.over_budget_categories}</div>
						<div class="text-sm text-gray-600">Over Budget</div>
					</div>
					<div class="text-center">
						<div class="text-3xl font-bold text-yellow-600">{budgetPerformance.under_budget_categories}</div>
						<div class="text-sm text-gray-600">Under Budget</div>
					</div>
					<div class="text-center">
						<div class="text-3xl font-bold text-blue-600">{formatCurrency(budgetPerformance.total_variance)}</div>
						<div class="text-sm text-gray-600">Total Variance</div>
					</div>
					<div class="text-center">
						<div class="text-3xl font-bold {budgetPerformance.performance_score >= 80 ? 'text-green-600' : budgetPerformance.performance_score >= 60 ? 'text-yellow-600' : 'text-red-600'}">
							{budgetPerformance.performance_score.toFixed(0)}%
						</div>
						<div class="text-sm text-gray-600">Performance Score</div>
					</div>
				</div>
			</Card>
		{/if}

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Category Spending Chart -->
			{#if categoryChartData()}
				<Card class="p-6">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">Category Spending Breakdown</h2>
					<div class="h-80">
						<FinanceChart
							type="doughnut"
							data={categoryChartData() as any}
						/>
					</div>
				</Card>
			{/if}

			<!-- Net Worth Trend Chart -->
			{#if netWorthChartData()}
				<Card class="p-6">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">Net Worth Trend</h2>
					<div class="h-80">
						<FinanceChart
							type="line"
							data={netWorthChartData() as any}
						/>
					</div>
				</Card>
			{/if}
		</div>

		<!-- Spending Trends Chart -->
		{#if spendingTrendsChartData()}
			<Card class="p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">Spending Trends by Category (Last 12 Months)</h2>
				<div class="h-96">
					<FinanceChart
						type="line"
						data={spendingTrendsChartData() as any}
					/>
				</div>
			</Card>
		{/if}

		<!-- Category Details Table -->
		{#if categorySpending.length > 0}
			<Card class="p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">Category Spending Details</h2>
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spent</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each categorySpending as category}
								<tr>
									<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
										{category.category_name}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{formatCurrency(category.budgeted_amount)}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{formatCurrency(category.spent_amount)}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm {category.remaining_amount >= 0 ? 'text-green-600' : 'text-red-600'}">
										{formatCurrency(category.remaining_amount)}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex items-center">
											<div class="flex-1 bg-gray-200 rounded-full h-2 mr-2">
												<div 
													class="h-2 rounded-full {category.percentage_used > 100 ? 'bg-red-500' : category.percentage_used > 80 ? 'bg-yellow-500' : 'bg-green-500'}"
													style="width: {Math.min(category.percentage_used, 100)}%"
												></div>
											</div>
											<span class="text-sm font-medium {category.percentage_used > 100 ? 'text-red-600' : category.percentage_used > 80 ? 'text-yellow-600' : 'text-green-600'}">
												{category.percentage_used.toFixed(1)}%
											</span>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</Card>
		{/if}
	{/if}
		</div>
	</div>
</div>
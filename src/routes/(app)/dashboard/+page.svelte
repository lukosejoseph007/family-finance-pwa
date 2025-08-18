<script lang="ts">
	import { onMount } from 'svelte';
	import { user } from '$lib/store';
	import { Card, Button, FinanceChart } from '$lib/components';
	import {
		createExpenseByCategory,
		createMonthlyTrend,
		createBudgetComparison,
		formatCurrency
	} from '$lib/components/charts/ChartUtils';
	import { getUserDisplayName } from '$lib/utils/user';
	import {
		getMonthlyReport,
		getCategorySpendingReport,
		getAccountBalanceDistribution,
		getBudgetPerformance
	} from '$lib/services/reportingService';
	import { getAccountSummary } from '$lib/services/accountService';
	import { getCurrentMonth } from '$lib/services/budgetService';

	let { data } = $props();

	// Keep the user store in sync with the server session
	if (data.session?.user) {
		user.set(data.session.user);
	}

	// Dashboard data state
	let loading = $state(true);
	let error = $state('');
	let accountSummary = $state({
		total_assets: 0,
		total_liabilities: 0,
		net_worth: 0,
		account_count: 0
	});
	let monthlyReport = $state({
		income: 0,
		expenses: 0,
		net_amount: 0,
		budget_allocated: 0,
		budget_remaining: 0
	});
	let budgetPerformance = $state({
		on_track_categories: 0,
		over_budget_categories: 0,
		performance_score: 0
	});

	// Chart data
	let expenseChart = $state<any>(null);
	let trendChart = $state<any>(null);
	let budgetComparisonChart = $state<any>(null);

	onMount(async () => {
		await loadDashboardData();
	});

	async function loadDashboardData() {
		try {
			loading = true;
			error = '';
			const currentMonth = getCurrentMonth();

			// Load all dashboard data in parallel
			const [
				accountSummaryData,
				monthlyReportData,
				budgetPerformanceData,
				categorySpending,
				accountDistribution
			] = await Promise.all([
				getAccountSummary(),
				getMonthlyReport(currentMonth),
				getBudgetPerformance(currentMonth),
				getCategorySpendingReport(currentMonth),
				getAccountBalanceDistribution()
			]);

			// Update state
			accountSummary = accountSummaryData;
			monthlyReport = monthlyReportData;
			budgetPerformance = budgetPerformanceData;

			// Create chart data
			if (categorySpending.length > 0) {
				const expenseData = categorySpending
					.filter(cat => cat.spent_amount > 0)
					.map(cat => ({
						category: cat.category_name,
						amount: cat.spent_amount
					}));
				
				if (expenseData.length > 0) {
					expenseChart = createExpenseByCategory(expenseData);
				}

				// Budget comparison chart
				const budgetCategories = categorySpending.map(cat => cat.category_name);
				const budgetPlanned = categorySpending.map(cat => cat.budgeted_amount);
				const budgetActual = categorySpending.map(cat => cat.spent_amount);
				
				budgetComparisonChart = createBudgetComparison(budgetCategories, budgetPlanned, budgetActual);
			}

			// Only create trend chart if there's actual historical data
			// For new users, this will remain null and show empty state
			if (monthlyReport.income > 0 || monthlyReport.expenses > 0) {
				// In a real implementation, you would fetch historical data here
				// For now, we'll leave it null to show the empty state for new users
				trendChart = null;
			}

		} catch (err: any) {
			error = err.message || 'Failed to load dashboard data';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Dashboard - Family Finance</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-x-hidden">
	<!-- Hero Section with Quick Transaction -->
	<div class="relative overflow-hidden">
		<!-- Background Pattern -->
		<div class="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700"></div>
		<div class="absolute inset-0 bg-black/10"></div>
		<div class="absolute inset-0" style="background-image: radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)"></div>
		
		<div class="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-full">
			<!-- Welcome Header -->
			<div class="text-center mb-8">
				<h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
					Welcome back, {getUserDisplayName(data.session?.user).split(' ')[0]}!
				</h1>
				<p class="text-blue-100 text-base sm:text-lg opacity-90">
					{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
				</p>
			</div>

			<!-- Quick Transaction Card -->
			<div class="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto">
				<div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl lg:rounded-3xl p-6 sm:p-8 lg:p-12">
					<!-- Mobile Layout (unchanged) -->
					<div class="text-center lg:hidden">
						<div class="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
							<span class="text-3xl">💰</span>
						</div>
						<h2 class="text-2xl sm:text-3xl font-bold text-white mb-2">Record A Transaction</h2>
						<p class="text-blue-100 mb-6 text-base sm:text-lg">Record your latest expense or income instantly</p>
						
						<a href="/transactions" class="block">
							<button class="w-full bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-300 hover:to-orange-300 text-gray-900 font-bold py-5 px-8 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl text-lg">
								<span class="inline-flex items-center justify-center">
									<svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
									</svg>
									Add Transaction Now
								</span>
							</button>
						</a>
					</div>
					
					<!-- Desktop Layout (simplified and centered) -->
					<div class="hidden lg:flex lg:items-center lg:justify-center lg:text-center">
						<div class="max-w-2xl mx-auto">
							<div class="flex items-center justify-center space-x-6 mb-8">
								<div class="flex items-center justify-center w-20 h-20 xl:w-24 xl:h-24 bg-white/20 rounded-2xl">
									<span class="text-4xl xl:text-5xl">💰</span>
								</div>
								<div>
									<h2 class="text-3xl xl:text-4xl font-bold text-white mb-2">Record A Transaction</h2>
									<p class="text-blue-100 text-lg xl:text-xl">Record your latest expense or income instantly</p>
								</div>
							</div>
							
							<!-- Single centered CTA button -->
							<div class="flex justify-center">
								<a href="/transactions" class="block">
									<button class="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-300 hover:to-orange-300 text-gray-900 font-bold py-6 xl:py-8 px-12 xl:px-16 rounded-2xl shadow-2xl transform transition-all duration-200 hover:scale-105 hover:shadow-3xl text-xl xl:text-2xl">
										<span class="flex items-center justify-center space-x-4">
											<svg class="w-8 h-8 xl:w-10 xl:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
											</svg>
											<span class="whitespace-nowrap">Add Transaction</span>
										</span>
									</button>
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Content Section -->
	<div class="relative overflow-x-hidden">
		<div class="px-4 sm:px-6 lg:px-8 py-8 pb-12 max-w-full">
			{#if loading}
				<div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center mb-8">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p class="text-lg text-gray-600">Loading your financial overview...</p>
				</div>
			{:else if error}
				<div class="bg-white rounded-2xl shadow-xl border border-red-200 p-6 mb-8">
					<div class="flex items-center space-x-3">
						<div class="flex-shrink-0">
							<svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div class="flex-1">
							<h3 class="text-xl font-medium text-red-900">Error loading dashboard</h3>
							<p class="text-lg text-red-700">{error}</p>
						</div>
						<button onclick={loadDashboardData} class="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg transition-colors">
							Try Again
						</button>
					</div>
				</div>
			{:else}
				<!-- Financial Overview Cards -->
				<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 max-w-full overflow-x-hidden">
					<!-- Net Worth Card -->
					<div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
						<div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full -translate-y-10 translate-x-10 opacity-10 group-hover:scale-110 transition-transform duration-300"></div>
						<div class="relative">
							<div class="flex items-center justify-between mb-3">
								<div class="p-2 bg-green-50 rounded-lg">
									<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
									</svg>
								</div>
								<span class="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Assets</span>
							</div>
							<div class="text-xl lg:text-4xl font-bold text-gray-900 mb-1">{formatCurrency(accountSummary.net_worth)}</div>
							<p class="text-base text-gray-500">Net Worth</p>
						</div>
					</div>

					<!-- Monthly Income Card -->
					<div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
						<div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full -translate-y-10 translate-x-10 opacity-10 group-hover:scale-110 transition-transform duration-300"></div>
						<div class="relative">
							<div class="flex items-center justify-between mb-3">
								<div class="p-2 bg-blue-50 rounded-lg">
									<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
									</svg>
								</div>
								<span class="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Income</span>
							</div>
							<div class="text-xl lg:text-4xl font-bold text-gray-900 mb-1">{formatCurrency(monthlyReport.income)}</div>
							<p class="text-base text-gray-500">This Month</p>
						</div>
					</div>

					<!-- Monthly Expenses Card -->
					<div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
						<div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-400 to-pink-500 rounded-full -translate-y-10 translate-x-10 opacity-10 group-hover:scale-110 transition-transform duration-300"></div>
						<div class="relative">
							<div class="flex items-center justify-between mb-3">
								<div class="p-2 bg-red-50 rounded-lg">
									<svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
									</svg>
								</div>
								<span class="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">Expenses</span>
							</div>
							<div class="text-xl lg:text-4xl font-bold text-gray-900 mb-1">{formatCurrency(monthlyReport.expenses)}</div>
							<p class="text-base text-gray-500">This Month</p>
						</div>
					</div>

					<!-- Budget Performance Card -->
					<div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
						<div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full -translate-y-10 translate-x-10 opacity-10 group-hover:scale-110 transition-transform duration-300"></div>
						<div class="relative">
							<div class="flex items-center justify-between mb-3">
								<div class="p-2 bg-purple-50 rounded-lg">
									<svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
									</svg>
								</div>
								<span class="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Budget</span>
							</div>
							<div class="text-xl lg:text-4xl font-bold text-gray-900 mb-1">{budgetPerformance.performance_score}%</div>
							<p class="text-base text-gray-500">On Track</p>
						</div>
					</div>
				</div>

				<!-- Charts Section -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 max-w-full overflow-x-hidden">
					<!-- Monthly Trend Chart -->
					<div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
						<div class="flex items-center justify-between mb-6">
							<h3 class="text-xl font-semibold text-gray-900">Income vs Expenses</h3>
							<div class="flex items-center space-x-2">
								<div class="w-3 h-3 bg-green-400 rounded-full"></div>
								<span class="text-xs text-gray-500">Income</span>
								<div class="w-3 h-3 bg-red-400 rounded-full"></div>
								<span class="text-xs text-gray-500">Expenses</span>
							</div>
						</div>
						{#if trendChart}
							<FinanceChart type="line" data={trendChart} height="280px" />
						{:else}
							<div class="h-64 flex items-center justify-center text-gray-400">
								<div class="text-center">
									<div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
										<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
										</svg>
									</div>
									<p class="text-sm font-medium text-gray-600">Building your trend analysis</p>
									<p class="text-xs text-gray-400 mt-1">Add transactions to see patterns</p>
								</div>
							</div>
						{/if}
					</div>

					<!-- Expense Categories Chart -->
					<div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
						<div class="flex items-center justify-between mb-6">
							<h3 class="text-xl font-semibold text-gray-900">Expense Breakdown</h3>
							<span class="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">This Month</span>
						</div>
						{#if expenseChart}
							<FinanceChart type="doughnut" data={expenseChart} height="280px" />
						{:else}
							<div class="h-64 flex items-center justify-center text-gray-400">
								<div class="text-center">
									<div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
										<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
										</svg>
									</div>
									<p class="text-sm font-medium text-gray-600">Ready for insights</p>
									<p class="text-xs text-gray-400 mt-1">Start adding transactions to see your spending patterns</p>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Quick Actions Grid -->
				<div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
					<h3 class="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-full overflow-x-hidden">
						<a href="/accounts" class="group">
							<div class="relative p-6 rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-all duration-200 hover:shadow-lg">
								<div class="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
								<div class="relative text-center">
									<div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
										<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
										</svg>
									</div>
									<span class="text-base font-medium text-gray-700 group-hover:text-blue-700">Accounts</span>
								</div>
							</div>
						</a>

						<a href="/categories" class="group">
							<div class="relative p-6 rounded-xl border-2 border-gray-100 hover:border-purple-200 transition-all duration-200 hover:shadow-lg">
								<div class="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
								<div class="relative text-center">
									<div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
										<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
										</svg>
									</div>
									<span class="text-base font-medium text-gray-700 group-hover:text-purple-700">Categories</span>
								</div>
							</div>
						</a>

						<a href="/budget" class="group">
							<div class="relative p-6 rounded-xl border-2 border-gray-100 hover:border-green-200 transition-all duration-200 hover:shadow-lg">
								<div class="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
								<div class="relative text-center">
									<div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
										<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
										</svg>
									</div>
									<span class="text-base font-medium text-gray-700 group-hover:text-green-700">Budget</span>
								</div>
							</div>
						</a>

						<a href="/reports" class="group">
							<div class="relative p-6 rounded-xl border-2 border-gray-100 hover:border-orange-200 transition-all duration-200 hover:shadow-lg">
								<div class="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
								<div class="relative text-center">
									<div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
										<svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
										</svg>
									</div>
									<span class="text-base font-medium text-gray-700 group-hover:text-orange-700">Reports</span>
								</div>
							</div>
						</a>
					</div>
				</div>

				<!-- Budget Performance Details -->
				{#if budgetComparisonChart}
					<div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
						<div class="flex items-center justify-between mb-6">
							<h3 class="text-xl font-semibold text-gray-900">Budget vs Actual Spending</h3>
							<span class="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">This Month</span>
						</div>
						<FinanceChart type="bar" data={budgetComparisonChart} height="350px" />
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>

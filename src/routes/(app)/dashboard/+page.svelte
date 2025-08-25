<script lang="ts">
  import MetricCard from '$lib/components/finance/MetricCard.svelte';
  import WaterfallChart from '$lib/components/charts/WaterfallChart.svelte';
  import TrendChart from '$lib/components/charts/TrendChart.svelte';
  import PieChart from '$lib/components/charts/PieChart.svelte';
  
  const viewOptions = [
    { id: 'waterfall', label: 'Cash Flow' },
    { id: 'breakdown', label: 'Breakdown' },
    { id: 'trends', label: 'Trends' }
  ] as const;
  
  let selectedView = $state<'waterfall' | 'breakdown' | 'trends'>('waterfall');
  // Component imports already exist in lines 2-4
  
	import { onMount } from 'svelte';
	import { user } from '$lib/store';
	import { Card, Button, LineChart, BarChart, Modal, Input, EmptyState, ProgressRing, InsightWidget } from '$lib/components';
	import { formatCurrency } from '$lib/utils/currency';
	import { getUserDisplayName } from '$lib/utils/user';
	import {
		getMonthlyReport,
		getCategorySpendingReport,
		getAccountBalanceDistribution,
		getBudgetPerformance,
		getHistoricalReports
	} from '$lib/services/reportingService';
	import { getAccountSummary, getAccounts } from '$lib/services/accountService';
	import { getCategories } from '$lib/services/categoryService';
	import { createTransaction, validateTransactionData } from '$lib/services/transactionService';
	import { getCurrentMonth } from '$lib/services/budgetService';
	import type { TransactionFormData, Account, Category } from '$lib/types';

	// Initialize typed state variables
	let { data } = $props();

	// Keep the user store in sync with the server session from parent layout
	// Session comes from parent layout, not page data
	// user.set is handled by the layout component

	// Dashboard data state
	let loading = $state(true);
	let error = $state('');
	let success = $state('');
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

	// Dashboard metrics and chart data from page data
	const metrics = data.metrics;
	const waterfallData = data.dashboard.waterfall;
	const monthlyTrends = data.dashboard.trends;
	const expenseCategories = data.dashboard.pie;
	const currency = 'INR'; // ISO 4217 currency code

	const transformedBudgetData = $derived(() => {
		if (!budgetComparisonChart || !budgetComparisonChart.budgeted || !budgetComparisonChart.spent) {
			return [];
		}
		return budgetComparisonChart.budgeted
			.map((item: any) => {
				if (!item) {
					return null;
				}
				const spentItem = budgetComparisonChart.spent.find(
					(s: any) => s && s.category === item.category
				);
				return {
					category: item.category || 'Unknown',
					budgeted: Number(item.amount) || 0,
					spent: spentItem ? Number(spentItem.amount) || 0 : 0
				};
			})
			.filter((item: any) => item && item.category && item.category !== 'Unknown');
	});

	// Modal states
	let addModalOpen = $state(false);
	let formData: TransactionFormData = $state({
		account_id: '',
		category_id: null,
		amount: '',
		transaction_date: new Date().toISOString().split('T')[0],
		description: '',
		memo: '',
		is_cleared: false
	});
	let formErrors: string[] = $state([]);
	let saving = $state(false);
	let accounts: Account[] = $state([]);
let categories: Category[] = $state([]);

	onMount(() => {
		// Async part
		const loadAsyncData = async () => {
			await loadDashboardData();
			const accountsData = await getAccounts();
			accounts = accountsData.filter((acc) => acc.is_active);
			const categoriesData = await getCategories();
			categories = categoriesData.filter((cat) => cat.is_active);
		};

		loadAsyncData();

		// Sync part
		const handleFabClick = (event: CustomEvent) => {
			if (event.detail.page === '/dashboard') {
				openAddModal();
			}
		};

		window.addEventListener('fab-click', handleFabClick as EventListener);

		// Return cleanup function synchronously
		return () => {
			window.removeEventListener('fab-click', handleFabClick as EventListener);
		};
	});

	async function loadDashboardData() {
		try {
			loading = true;
			error = '';
			const currentMonth = getCurrentMonth();
			const historicalMonths = 6; // Number of months to show in trend chart

			// Load all dashboard data in parallel
			const [
				accountSummaryData,
				monthlyReportData,
				budgetPerformanceData,
				categorySpending,
				accountDistribution,
				historicalData
			] = await Promise.all([
				getAccountSummary(),
				getMonthlyReport(currentMonth),
				getBudgetPerformance(currentMonth),
				getCategorySpendingReport(currentMonth),
				getAccountBalanceDistribution(),
				getHistoricalReports(historicalMonths)
			]);

			// Update state
			accountSummary = accountSummaryData;
			monthlyReport = monthlyReportData;
			budgetPerformance = budgetPerformanceData;

			// Create chart data
			if (categorySpending.length > 0) {
				// Expense by category chart data (PieChart format)
				expenseChart = categorySpending.map(cat => ({
					label: cat.category_name,
					value: cat.spent_amount
				}));

				// Budget comparison chart data (LayerChart format)
				budgetComparisonChart = {
					budgeted: categorySpending.map(cat => ({
						category: cat.category_name,
						amount: cat.budgeted_amount
					})),
					spent: categorySpending.map(cat => ({
						category: cat.category_name,
						amount: cat.spent_amount
					}))
				};
			}

			// Create trend chart with current month data (LayerChart format)
			if (monthlyReport.income > 0 || monthlyReport.expenses > 0) {
				trendChart = [
					{
						date: 'Current Month',
						income: monthlyReport.income,
						expenses: monthlyReport.expenses
					}
				];
			}
		} catch (err: any) {
			error = err.message || 'Failed to load dashboard data';
		} finally {
			loading = false;
		}
	}

	function openAddModal() {
		formData = {
			account_id: accounts.length > 0 ? accounts[0].id : '',
			category_id: null,
			amount: '',
			transaction_date: new Date().toISOString().split('T')[0],
			description: '',
			memo: '',
			is_cleared: false
		};
		formErrors = [];
		addModalOpen = true;
	}

	async function handleSave() {
		formErrors = validateTransactionData(formData);
		if (formErrors.length > 0) return;

		try {
			saving = true;
			error = '';

			const isIncome = categories.find((c: Category) => c.id === formData.category_id)?.type === 'income';
			const amount = isIncome
				? Math.abs(parseFloat(formData.amount))
				: -Math.abs(parseFloat(formData.amount));

			const transactionData = {
				...formData,
				amount: amount.toString()
			};

			await createTransaction(transactionData);
			addModalOpen = false;
			success = 'Transaction added successfully';

			await loadDashboardData(); // Refresh dashboard data
			setTimeout(() => (success = ''), 3000);
		} catch (err: any) {
			error = err.message || 'Failed to save transaction';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Dashboard - Family Finance</title>
</svelte:head>

<div
	class="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
>
	<!-- Hero Section with Quick Transaction -->
	<div class="relative overflow-hidden">
		<!-- Background Pattern -->
		<div
			class="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700"
		></div>
		<div class="absolute inset-0 bg-black/10"></div>
		<div
			class="absolute inset-0"
			style="background-image: radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)"
		></div>

		<div class="relative max-w-full px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
			<!-- Welcome Header -->
			<div class="mb-6 text-center sm:mb-8">
				<h1 class="mb-2 text-2xl font-bold text-white sm:text-3xl md:text-4xl lg:text-5xl">
					Welcome back, {$user ? getUserDisplayName($user).split(' ')[0] : 'User'}!
				</h1>
				<p class="text-sm text-blue-100 opacity-90 sm:text-base lg:text-lg">
					{new Date().toLocaleDateString('en-IN', {
						weekday: 'long',
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</p>
			</div>

			<!-- Quick Transaction Card -->
			<div class="mx-auto max-w-sm sm:max-w-md lg:max-w-4xl xl:max-w-6xl">
				<div
					class="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm sm:p-6 md:p-8 lg:rounded-2xl lg:p-10 xl:rounded-3xl xl:p-12"
				>
					<!-- Mobile/Tablet Layout -->
					<div class="text-center lg:hidden">
						<div
							class="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/20 sm:mb-4 sm:h-16 sm:w-16"
						>
							<span class="text-2xl sm:text-3xl">💰</span>
						</div>
						<h2 class="mb-2 text-xl font-bold text-white sm:text-2xl md:text-3xl">Record A Transaction</h2>
						<p class="mb-4 text-sm text-blue-100 sm:mb-6 sm:text-base md:text-lg">
							Record your latest expense or income instantly
						</p>

						<button
							onclick={openAddModal}
							class="w-full transform rounded-lg bg-gradient-to-r from-yellow-400 to-orange-400 px-6 py-4 text-base font-bold text-gray-900 shadow-lg transition-all duration-200 hover:scale-105 hover:from-yellow-300 hover:to-orange-300 hover:shadow-xl sm:rounded-xl sm:px-8 sm:py-5 sm:text-lg"
						>
							<span class="inline-flex items-center justify-center">
								<svg class="mr-2 h-5 w-5 sm:mr-3 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 4v16m8-8H4"
									/>
								</svg>
								<span class="sm:hidden">Add Transaction</span>
								<span class="hidden sm:inline">Add Transaction Now</span>
							</span>
						</button>
					</div>

					<!-- Desktop Layout -->
					<div class="hidden lg:flex lg:items-center lg:justify-center lg:text-center">
						<div class="mx-auto max-w-2xl">
							<div class="mb-6 flex items-center justify-center space-x-4 xl:mb-8 xl:space-x-6">
								<div
									class="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 xl:h-20 xl:w-20"
								>
									<span class="text-3xl xl:text-4xl">💰</span>
								</div>
								<div class="text-left">
									<h2 class="mb-1 text-2xl font-bold text-white xl:mb-2 xl:text-3xl">
										Record A Transaction
									</h2>
									<p class="text-base text-blue-100 xl:text-lg">
										Record your latest expense or income instantly
									</p>
								</div>
							</div>

							<!-- CTA button -->
							<div class="flex justify-center">
								<button
									onclick={openAddModal}
									class="transform rounded-xl bg-gradient-to-r from-yellow-400 to-orange-400 px-8 py-4 text-lg font-bold text-gray-900 shadow-2xl transition-all duration-200 hover:scale-105 hover:from-yellow-300 hover:to-orange-300 hover:shadow-3xl xl:px-12 xl:py-6 xl:text-xl"
								>
									<span class="flex items-center justify-center space-x-3">
										<svg
											class="h-6 w-6 xl:h-8 xl:w-8"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 4v16m8-8H4"
											/>
										</svg>
										<span class="whitespace-nowrap">Add Transaction</span>
									</span>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Content Section -->
	<div class="relative overflow-x-hidden">
		<div class="max-w-full px-4 py-8 pb-12 sm:px-6 lg:px-8">
			{#if loading}
				<div class="mb-8 rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-xl">
					<div
						class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"
					></div>
					<p class="text-lg text-gray-600">Loading your financial overview...</p>
				</div>
			{:else if error}
				<div class="mb-8 rounded-2xl border border-red-200 bg-white p-6 shadow-xl">
					<div class="flex items-center space-x-3">
						<div class="flex-shrink-0">
							<svg
								class="h-8 w-8 text-red-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<div class="flex-1">
							<h3 class="text-xl font-medium text-red-900">Error loading dashboard</h3>
							<p class="text-lg text-red-700">{error}</p>
						</div>
						<button
							onclick={loadDashboardData}
							class="rounded-lg bg-red-100 px-4 py-2 text-red-800 transition-colors hover:bg-red-200"
						>
							Try Again
						</button>
					</div>
				</div>
			{:else}
				<!-- Financial Overview Cards -->
				<div
					class="mb-6 grid max-w-full grid-cols-1 gap-3 overflow-x-hidden sm:grid-cols-2 sm:gap-4 lg:mb-8 lg:grid-cols-4 lg:gap-6"
				>
					<!-- Net Worth Card -->
					<div
						class="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl"
					>
						<div
							class="absolute top-0 right-0 h-20 w-20 translate-x-10 -translate-y-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 opacity-10 transition-transform duration-300 group-hover:scale-110"
						></div>
						<div class="relative">
							<div class="mb-3 flex items-center justify-between">
								<div class="rounded-lg bg-green-50 p-2">
									<svg
										class="h-5 w-5 text-green-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
										/>
									</svg>
								</div>
								<span class="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-600"
									>Assets</span
								>
							</div>
							<div class="mb-1 text-xl font-bold text-gray-900 lg:text-3xl">
								{formatCurrency(accountSummary.net_worth, currency)}
							</div>
							<p class="text-base text-gray-500">Net Worth</p>
						</div>
					</div>

					<!-- Monthly Income Card -->
					<div
						class="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl"
					>
						<div
							class="absolute top-0 right-0 h-20 w-20 translate-x-10 -translate-y-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 opacity-10 transition-transform duration-300 group-hover:scale-110"
						></div>
						<div class="relative">
							<div class="mb-3 flex items-center justify-between">
								<div class="rounded-lg bg-blue-50 p-2">
									<svg
										class="h-5 w-5 text-blue-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
										/>
									</svg>
								</div>
								<span class="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600"
									>Income</span
								>
							</div>
							<div class="mb-1 text-xl font-bold text-gray-900 lg:text-3xl">
								{formatCurrency(monthlyReport.income, currency)}
							</div>
							<p class="text-base text-gray-500">This Month</p>
						</div>
					</div>

					<!-- Monthly Expenses Card -->
					<div
						class="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl"
					>
						<div
							class="absolute top-0 right-0 h-20 w-20 translate-x-10 -translate-y-10 rounded-full bg-gradient-to-br from-red-400 to-pink-500 opacity-10 transition-transform duration-300 group-hover:scale-110"
						></div>
						<div class="relative">
							<div class="mb-3 flex items-center justify-between">
								<div class="rounded-lg bg-red-50 p-2">
									<svg
										class="h-5 w-5 text-red-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
										/>
									</svg>
								</div>
								<span class="rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-600"
									>Expenses</span
								>
							</div>
							<div class="mb-1 text-xl font-bold text-gray-900 lg:text-3xl">
								{formatCurrency(monthlyReport.expenses, currency)}
							</div>
							<p class="text-base text-gray-500">This Month</p>
						</div>
					</div>

					<!-- Budget Performance Card with Progress Ring -->
					<div
						class="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-purple-200 sm:p-6"
					>
						<div
							class="absolute top-0 right-0 h-20 w-20 translate-x-10 -translate-y-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 opacity-10 transition-transform duration-300 group-hover:scale-110"
						></div>
						<div class="relative">
							<!-- Mobile Layout -->
							<div class="sm:hidden">
								<div class="mb-3 flex items-center justify-between">
									<div class="rounded-lg bg-purple-50 p-2 transition-colors group-hover:bg-purple-100">
										<svg
											class="h-4 w-4 text-purple-600 transition-transform group-hover:scale-110"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
											/>
										</svg>
									</div>
									<span
										class="rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-600 transition-all group-hover:bg-purple-100"
										>Budget</span
									>
								</div>
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<p class="text-sm font-medium text-gray-900 mb-1">Budget Health</p>
										<div class="text-xs text-gray-600">
											{budgetPerformance.on_track_categories} on track
										</div>
									</div>
									<div class="ml-3">
										<ProgressRing
											value={budgetPerformance.performance_score}
											max={100}
											size={75}
											strokeWidth={5}
											showValue={true}
											animated={true}
										/>
									</div>
								</div>
							</div>
							
							<!-- Desktop Layout -->
							<div class="hidden sm:block">
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<div class="mb-3 flex items-center justify-between">
											<div class="rounded-lg bg-purple-50 p-2 transition-colors group-hover:bg-purple-100">
												<svg
													class="h-5 w-5 text-purple-600 transition-transform group-hover:scale-110"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
													/>
												</svg>
											</div>
											<span
												class="rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-600 transition-all group-hover:bg-purple-100"
												>Budget</span
											>
										</div>
										<p class="text-base text-gray-900 font-medium mb-2">Budget Health</p>
										<div class="text-sm text-gray-600">
											<span class="inline-flex items-center">
												<span class="mr-1 h-2 w-2 rounded-full bg-green-400"></span>
												{budgetPerformance.on_track_categories} on track
											</span>
											<span class="ml-3 inline-flex items-center">
												<span class="mr-1 h-2 w-2 rounded-full bg-red-400"></span>
												{budgetPerformance.over_budget_categories} over budget
											</span>
										</div>
									</div>
									<div class="ml-4">
										<ProgressRing
											value={budgetPerformance.performance_score}
											max={100}
											size={80}
											strokeWidth={6}
											showValue={true}
											animated={true}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Redesigned Charts Section -->
				<div class="mb-8 space-y-6">
					<!-- View Selector -->
					<div class="flex justify-center">
						<div class="bg-gray-200 p-1 rounded-xl">
							{#each viewOptions as option}
								<button
									class="px-6 py-3 rounded-lg font-semibold transition-all"
									class:bg-white={selectedView === option.id}
									class:text-blue-500={selectedView === option.id}
									class:text-gray-600={selectedView !== option.id}
									onclick={() => (selectedView = option.id)}
								>
									{option.label}
								</button>
							{/each}
						</div>
					</div>

					<!-- Chart Container -->
					<div class="bg-white rounded-xl p-6 shadow-lg">
						{#if selectedView === 'waterfall'}
							<WaterfallChart
								data={waterfallData}
								currency={currency}
							/>
						{:else if selectedView === 'breakdown'}
							<PieChart
								data={expenseCategories}
								currency={currency}
							/>
						{:else if selectedView === 'trends'}
							<TrendChart
								data={monthlyTrends}
								currency={currency}
							/>
						{/if}
					</div>

					<!-- Metrics Grid -->
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<MetricCard
							title="Total Income"
							value={formatCurrency(metrics.income, currency)}
							trend={`${formatCurrency(metrics.income/6, currency)}/mo`}
							accentColor="#10B981"
						/>
						<MetricCard
							title="Total Expenses"
							value={formatCurrency(metrics.expenses, currency)}
							trend={`${formatCurrency(metrics.expenses/6, currency)}/mo`}
							accentColor="#EF4444"
						/>
						<MetricCard
							title="Net Savings"
							value={formatCurrency(metrics.savings, currency)}
							trend={`${formatCurrency(metrics.savings/6, currency)}/mo`}
							accentColor="#3B82F6"
						/>
						<MetricCard
							title="Savings Rate"
							value={`${Math.round((metrics.savings / metrics.income) * 100)}%`}
							trend="Target: 20%"
							accentColor="#8B5CF6"
						/>
					</div>
				</div>

				<!-- Quick Actions Grid -->
				<div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-xl sm:p-6">
					<div class="mb-4 flex items-center justify-between sm:mb-6">
						<h3 class="text-lg font-semibold text-gray-900 sm:text-xl">Quick Actions</h3>
						<div class="rounded-full bg-gradient-to-r from-blue-100 to-purple-100 p-2">
							<svg class="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
							</svg>
						</div>
					</div>
					<div class="grid max-w-full grid-cols-2 gap-3 overflow-x-hidden sm:gap-4 lg:grid-cols-4">
						<a href="/accounts" class="group">
							<div
								class="relative rounded-xl border-2 border-gray-100 p-4 transition-all duration-300 hover:border-blue-200 hover:shadow-lg hover:-translate-y-1 sm:p-6"
							>
								<div
									class="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
								></div>
								<div class="relative text-center">
									<div
										class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 sm:mb-3 sm:h-12 sm:w-12"
									>
										<svg
											class="h-5 w-5 text-blue-600 sm:h-6 sm:w-6"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
											/>
										</svg>
									</div>
									<span class="text-sm font-medium text-gray-700 transition-colors group-hover:text-blue-700 sm:text-base"
										>Accounts</span
									>
								</div>
							</div>
						</a>

						<a href="/categories" class="group">
							<div
								class="relative rounded-xl border-2 border-gray-100 p-4 transition-all duration-300 hover:border-purple-200 hover:shadow-lg hover:-translate-y-1 sm:p-6"
							>
								<div
									class="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
								></div>
								<div class="relative text-center">
									<div
										class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 sm:mb-3 sm:h-12 sm:w-12"
									>
										<svg
											class="h-5 w-5 text-purple-600 sm:h-6 sm:w-6"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
											/>
										</svg>
									</div>
									<span class="text-sm font-medium text-gray-700 transition-colors group-hover:text-purple-700 sm:text-base"
										>Categories</span
									>
								</div>
							</div>
						</a>

						<a href="/budget" class="group">
							<div
								class="relative rounded-xl border-2 border-gray-100 p-4 transition-all duration-300 hover:border-green-200 hover:shadow-lg hover:-translate-y-1 sm:p-6"
							>
								<div
									class="absolute inset-0 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
								></div>
								<div class="relative text-center">
									<div
										class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 sm:mb-3 sm:h-12 sm:w-12"
									>
										<svg
											class="h-5 w-5 text-green-600 sm:h-6 sm:w-6"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
											/>
										</svg>
									</div>
									<span class="text-sm font-medium text-gray-700 transition-colors group-hover:text-green-700 sm:text-base"
										>Budget</span
									>
								</div>
							</div>
						</a>

						<a href="/reports" class="group">
							<div
								class="relative rounded-xl border-2 border-gray-100 p-4 transition-all duration-300 hover:border-orange-200 hover:shadow-lg hover:-translate-y-1 sm:p-6"
							>
								<div
									class="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
								></div>
								<div class="relative text-center">
									<div
										class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 sm:mb-3 sm:h-12 sm:w-12"
									>
										<svg
											class="h-5 w-5 text-orange-600 sm:h-6 sm:w-6"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
											/>
										</svg>
									</div>
									<span class="text-sm font-medium text-gray-700 transition-colors group-hover:text-orange-700 sm:text-base"
										>Reports</span
									>
								</div>
							</div>
						</a>
					</div>
				</div>

				<!-- Insights and Performance Grid -->
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<!-- Financial Health Widget -->
					<InsightWidget
						type="financial-health"
						title="Financial Health"
						data={{
							income: monthlyReport.income,
							expenses: monthlyReport.expenses,
							savings: monthlyReport.net_amount
						}}
						currency={currency}
					/>
					
					<!-- Budget Alerts Widget -->
					<InsightWidget
						type="budget-alert"
						title="Budget Alerts"
						data={{
							overBudgetCategories: [],
							nearLimitCategories: []
						}}
						currency={currency}
					/>
					
					<!-- Spending Trends Widget -->
					<InsightWidget
						type="spending-trends"
						title="Spending Trends"
						data={{
							thisMonth: monthlyReport.expenses,
							lastMonth: monthlyReport.expenses * 0.9 // Mock data for now
						}}
						currency={currency}
					/>
				</div>

				<!-- Budget Performance Details -->
				<div class="mt-6 rounded-2xl border border-gray-100 bg-white p-4 lg:p-6 shadow-xl">
					<div class="mb-4 lg:mb-6">
						<h3 class="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Budget vs Actual Spending</h3>
						<div class="flex flex-wrap items-center gap-3">
							<span class="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
								This Month
							</span>
							<div class="flex items-center space-x-4">
								<div class="flex items-center space-x-2">
									<div class="h-3 w-3 rounded-full bg-green-500"></div>
									<span class="text-xs font-medium text-gray-600">Budgeted</span>
								</div>
								<div class="flex items-center space-x-2">
									<div class="h-3 w-3 rounded-full bg-red-500"></div>
									<span class="text-xs font-medium text-gray-600">Spent</span>
								</div>
							</div>
						</div>
					</div>
					{#if transformedBudgetData.length > 0}
						<BarChart
							data={transformedBudgetData as unknown as Array<{category: string; budgeted: number; spent: number; label?: string; value?: number}>}
							xKey="category"
							yKeys={["budgeted", "spent"]}
							height={400}
							colors={["#10b981", "#ef4444"]}
						/>
					{:else}
						<EmptyState
							variant="budget"
							size="small"
							icon="📊"
							title="No budget data available"
							description="Set up your budget allocations to compare planned vs actual spending. Create category budgets, track spending against goals, and get alerts when overspending."
							actionText="Set Up Budget"
							actionHref="/budget"
						/>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Add Transaction Modal -->
<Modal bind:open={addModalOpen} title="Add New Transaction">
	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSave();
		}}
		class="space-y-6"
	>
		{#if formErrors.length > 0}
			<div class="rounded-md bg-red-50 p-4">
				<ul class="space-y-1 text-sm text-red-700">
					{#each formErrors as error}
						<li>• {error}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div>
				<label for="add-account" class="mb-1 block text-sm font-medium text-gray-700"
					>Account *</label
				>
				<select
					id="add-account"
					bind:value={formData.account_id}
					class="block w-full rounded-lg border-gray-300 px-3 py-2 text-sm"
					required
				>
					<option value="">Select an account</option>
					{#each accounts as account}
						<option value={account.id}>{account.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="add-category" class="mb-1 block text-sm font-medium text-gray-700"
					>Category</label
				>
				<select
					id="add-category"
					bind:value={formData.category_id}
					class="block w-full rounded-lg border-gray-300 px-3 py-2 text-sm"
				>
					<option value="">Select a category</option>
					{#each categories as category}
						<option value={category.id}>{category.name}</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<Input
				label="Amount *"
				type="number"
				step="0.01"
				bind:value={formData.amount}
				placeholder="0.00"
				required
			/>

			<Input label="Date *" type="date" bind:value={formData.transaction_date} required />
		</div>

		<Input
			label="Description *"
			bind:value={formData.description}
			placeholder="e.g., Grocery shopping, Salary deposit"
			required
		/>

		<Input label="Memo (Optional)" bind:value={formData.memo} placeholder="Additional notes..." />

		<div class="flex items-center">
			<input
				type="checkbox"
				bind:checked={formData.is_cleared}
				class="focus:ring-opacity-50 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
			/>
			<span class="ml-2 text-sm text-gray-700">Mark as cleared</span>
		</div>
	</form>

	<div slot="footer">
		<Button variant="outline" on:click={() => (addModalOpen = false)}>Cancel</Button>
		<Button on:click={handleSave} loading={saving} disabled={saving}>
			{saving ? 'Adding...' : 'Add Transaction'}
		</Button>
	</div>
</Modal>

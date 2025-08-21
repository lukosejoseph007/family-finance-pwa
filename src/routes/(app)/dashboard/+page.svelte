<script lang="ts">
	import { onMount } from 'svelte';
	import { user } from '$lib/store';
	import { Card, Button, FinanceChart, Modal, Input } from '$lib/components';
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
	import { getAccountSummary, getAccounts } from '$lib/services/accountService';
	import { getCategories } from '$lib/services/categoryService';
	import { createTransaction, validateTransactionData } from '$lib/services/transactionService';
	import { getCurrentMonth } from '$lib/services/budgetService';
	import type { TransactionFormData, Account, Category } from '$lib/types';

	let { data } = $props();

	// Keep the user store in sync with the server session
	if (data.session?.user) {
		user.set(data.session.user);
	}

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
					.filter((cat) => cat.spent_amount > 0)
					.map((cat) => ({
						category: cat.category_name,
						amount: cat.spent_amount
					}));

				if (expenseData.length > 0) {
					expenseChart = createExpenseByCategory(expenseData);
				}

				// Budget comparison chart
				const budgetCategories = categorySpending.map((cat) => cat.category_name);
				const budgetPlanned = categorySpending.map((cat) => cat.budgeted_amount);
				const budgetActual = categorySpending.map((cat) => cat.spent_amount);

				budgetComparisonChart = createBudgetComparison(
					budgetCategories,
					budgetPlanned,
					budgetActual
				);
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

			const isIncome = categories.find((c) => c.id === formData.category_id)?.type === 'income';
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
			<div class="mb-8 text-center">
				<h1 class="mb-2 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
					Welcome back, {getUserDisplayName(data.session?.user).split(' ')[0]}!
				</h1>
				<p class="text-base text-blue-100 opacity-90 sm:text-lg">
					{new Date().toLocaleDateString('en-IN', {
						weekday: 'long',
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</p>
			</div>

			<!-- Quick Transaction Card -->
			<div class="mx-auto max-w-md lg:max-w-4xl xl:max-w-6xl">
				<div
					class="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm sm:p-8 lg:rounded-3xl lg:p-12"
				>
					<!-- Mobile Layout (unchanged) -->
					<div class="text-center lg:hidden">
						<div
							class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/20"
						>
							<span class="text-3xl">💰</span>
						</div>
						<h2 class="mb-2 text-2xl font-bold text-white sm:text-3xl">Record A Transaction</h2>
						<p class="mb-6 text-base text-blue-100 sm:text-lg">
							Record your latest expense or income instantly
						</p>

						<button
							onclick={openAddModal}
							class="w-full transform rounded-xl bg-gradient-to-r from-yellow-400 to-orange-400 px-8 py-5 text-lg font-bold text-gray-900 shadow-lg transition-all duration-200 hover:scale-105 hover:from-yellow-300 hover:to-orange-300 hover:shadow-xl"
						>
							<span class="inline-flex items-center justify-center">
								<svg class="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 4v16m8-8H4"
									/>
								</svg>
								Add Transaction Now
							</span>
						</button>
					</div>

					<!-- Desktop Layout (simplified and centered) -->
					<div class="hidden lg:flex lg:items-center lg:justify-center lg:text-center">
						<div class="mx-auto max-w-2xl">
							<div class="mb-8 flex items-center justify-center space-x-6">
								<div
									class="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 xl:h-24 xl:w-24"
								>
									<span class="text-4xl xl:text-5xl">💰</span>
								</div>
								<div>
									<h2 class="mb-2 text-3xl font-bold text-white xl:text-4xl">
										Record A Transaction
									</h2>
									<p class="text-lg text-blue-100 xl:text-xl">
										Record your latest expense or income instantly
									</p>
								</div>
							</div>

							<!-- Single centered CTA button -->
							<div class="flex justify-center">
								<button
									onclick={openAddModal}
									class="hover:shadow-3xl transform rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-400 px-12 py-6 text-xl font-bold text-gray-900 shadow-2xl transition-all duration-200 hover:scale-105 hover:from-yellow-300 hover:to-orange-300 xl:px-16 xl:py-8 xl:text-2xl"
								>
									<span class="flex items-center justify-center space-x-4">
										<svg
											class="h-8 w-8 xl:h-10 xl:w-10"
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
					class="mb-8 grid max-w-full grid-cols-2 gap-4 overflow-x-hidden lg:grid-cols-4 lg:gap-6"
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
							<div class="mb-1 text-xl font-bold text-gray-900 lg:text-4xl">
								{formatCurrency(accountSummary.net_worth)}
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
							<div class="mb-1 text-xl font-bold text-gray-900 lg:text-4xl">
								{formatCurrency(monthlyReport.income)}
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
							<div class="mb-1 text-xl font-bold text-gray-900 lg:text-4xl">
								{formatCurrency(monthlyReport.expenses)}
							</div>
							<p class="text-base text-gray-500">This Month</p>
						</div>
					</div>

					<!-- Budget Performance Card -->
					<div
						class="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl"
					>
						<div
							class="absolute top-0 right-0 h-20 w-20 translate-x-10 -translate-y-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 opacity-10 transition-transform duration-300 group-hover:scale-110"
						></div>
						<div class="relative">
							<div class="mb-3 flex items-center justify-between">
								<div class="rounded-lg bg-purple-50 p-2">
									<svg
										class="h-5 w-5 text-purple-600"
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
									class="rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-600"
									>Budget</span
								>
							</div>
							<div class="mb-1 text-xl font-bold text-gray-900 lg:text-4xl">
								{budgetPerformance.performance_score}%
							</div>
							<p class="text-base text-gray-500">On Track</p>
						</div>
					</div>
				</div>

				<!-- Charts Section -->
				<div class="mb-8 grid max-w-full grid-cols-1 gap-6 overflow-x-hidden lg:grid-cols-2">
					<!-- Monthly Trend Chart -->
					<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
						<div class="mb-6 flex items-center justify-between">
							<h3 class="text-xl font-semibold text-gray-900">Income vs Expenses</h3>
							<div class="flex items-center space-x-2">
								<div class="h-3 w-3 rounded-full bg-green-400"></div>
								<span class="text-xs text-gray-500">Income</span>
								<div class="h-3 w-3 rounded-full bg-red-400"></div>
								<span class="text-xs text-gray-500">Expenses</span>
							</div>
						</div>
						{#if trendChart}
							<FinanceChart type="line" data={trendChart} height="280px" />
						{:else}
							<div class="flex h-64 items-center justify-center text-gray-400">
								<div class="text-center">
									<div
										class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100"
									>
										<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
											/>
										</svg>
									</div>
									<p class="text-sm font-medium text-gray-600">Building your trend analysis</p>
									<p class="mt-1 text-xs text-gray-400">Add transactions to see patterns</p>
								</div>
							</div>
						{/if}
					</div>

					<!-- Expense Categories Chart -->
					<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
						<div class="mb-6 flex items-center justify-between">
							<h3 class="text-xl font-semibold text-gray-900">Expense Breakdown</h3>
							<span class="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500"
								>This Month</span
							>
						</div>
						{#if expenseChart}
							<FinanceChart type="doughnut" data={expenseChart} height="280px" />
						{:else}
							<div class="flex h-64 items-center justify-center text-gray-400">
								<div class="text-center">
									<div
										class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100"
									>
										<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
											/>
										</svg>
									</div>
									<p class="text-sm font-medium text-gray-600">Ready for insights</p>
									<p class="mt-1 text-xs text-gray-400">
										Start adding transactions to see your spending patterns
									</p>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Quick Actions Grid -->
				<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
					<h3 class="mb-6 text-xl font-semibold text-gray-900">Quick Actions</h3>
					<div class="grid max-w-full grid-cols-2 gap-4 overflow-x-hidden sm:grid-cols-4">
						<a href="/accounts" class="group">
							<div
								class="relative rounded-xl border-2 border-gray-100 p-6 transition-all duration-200 hover:border-blue-200 hover:shadow-lg"
							>
								<div
									class="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
								></div>
								<div class="relative text-center">
									<div
										class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 transition-transform duration-200 group-hover:scale-110"
									>
										<svg
											class="h-6 w-6 text-blue-600"
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
									<span class="text-base font-medium text-gray-700 group-hover:text-blue-700"
										>Accounts</span
									>
								</div>
							</div>
						</a>

						<a href="/categories" class="group">
							<div
								class="relative rounded-xl border-2 border-gray-100 p-6 transition-all duration-200 hover:border-purple-200 hover:shadow-lg"
							>
								<div
									class="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
								></div>
								<div class="relative text-center">
									<div
										class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 transition-transform duration-200 group-hover:scale-110"
									>
										<svg
											class="h-6 w-6 text-purple-600"
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
									<span class="text-base font-medium text-gray-700 group-hover:text-purple-700"
										>Categories</span
									>
								</div>
							</div>
						</a>

						<a href="/budget" class="group">
							<div
								class="relative rounded-xl border-2 border-gray-100 p-6 transition-all duration-200 hover:border-green-200 hover:shadow-lg"
							>
								<div
									class="absolute inset-0 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
								></div>
								<div class="relative text-center">
									<div
										class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 transition-transform duration-200 group-hover:scale-110"
									>
										<svg
											class="h-6 w-6 text-green-600"
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
									<span class="text-base font-medium text-gray-700 group-hover:text-green-700"
										>Budget</span
									>
								</div>
							</div>
						</a>

						<a href="/reports" class="group">
							<div
								class="relative rounded-xl border-2 border-gray-100 p-6 transition-all duration-200 hover:border-orange-200 hover:shadow-lg"
							>
								<div
									class="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
								></div>
								<div class="relative text-center">
									<div
										class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 transition-transform duration-200 group-hover:scale-110"
									>
										<svg
											class="h-6 w-6 text-orange-600"
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
									<span class="text-base font-medium text-gray-700 group-hover:text-orange-700"
										>Reports</span
									>
								</div>
							</div>
						</a>
					</div>
				</div>

				<!-- Budget Performance Details -->
				{#if budgetComparisonChart}
					<div class="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
						<div class="mb-6 flex items-center justify-between">
							<h3 class="text-xl font-semibold text-gray-900">Budget vs Actual Spending</h3>
							<span class="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500"
								>This Month</span
							>
						</div>
						<FinanceChart type="bar" data={budgetComparisonChart} height="350px" />
					</div>
				{/if}
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

<script lang="ts">
	import FinanceChart from '$lib/components/charts/FinanceChart.svelte';
	import {
		createExpenseByCategory,
		createMonthlyTrend,
		createBudgetComparison,
		formatCurrency
	} from '$lib/components/charts/ChartUtils';

	// Sample data for demonstrations
	const expenseCategoryData = [
		{ category: 'Housing', amount: 1500 },
		{ category: 'Food', amount: 600 },
		{ category: 'Transportation', amount: 400 },
		{ category: 'Entertainment', amount: 200 },
		{ category: 'Utilities', amount: 300 },
		{ category: 'Healthcare', amount: 250 }
	];

	const monthlyIncomeData = [
		4500, 4800, 4600, 5000, 4900, 5200, 4700, 4800, 5100, 4900, 5000, 5300
	];
	const monthlyExpenseData = [
		3200, 3400, 3100, 3600, 3300, 3800, 3500, 3200, 3900, 3400, 3600, 3700
	];

	const budgetCategories = ['Housing', 'Food', 'Transportation', 'Entertainment', 'Utilities'];
	const budgetPlanned = [1500, 500, 350, 150, 300];
	const budgetActual = [1500, 600, 400, 200, 280];

	// Create chart data
	const expenseChart = createExpenseByCategory(expenseCategoryData);
	const trendChart = createMonthlyTrend(monthlyIncomeData, monthlyExpenseData);
	const budgetChart = createBudgetComparison(budgetCategories, budgetPlanned, budgetActual);

	// Calculate some summary stats
	const currentMonthIncome = monthlyIncomeData[monthlyIncomeData.length - 1];
	const currentMonthExpenses = monthlyExpenseData[monthlyExpenseData.length - 1];
	const monthlySavings = currentMonthIncome - currentMonthExpenses;
</script>

<div class="container mx-auto space-y-8 p-6">
	<div class="mb-8 text-center">
		<h1 class="mb-2 text-4xl font-bold text-gray-900">Financial Charts Demo</h1>
		<p class="text-lg text-gray-600">
			Comprehensive visualization system for family finance tracking
		</p>
	</div>

	<!-- Summary Cards -->
	<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
		<div class="rounded-lg border-l-4 border-green-500 bg-white p-6 shadow-md">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
						<span class="font-bold text-green-600">💰</span>
					</div>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">Monthly Income</p>
					<p class="text-2xl font-bold text-gray-900">{formatCurrency(currentMonthIncome)}</p>
				</div>
			</div>
		</div>

		<div class="rounded-lg border-l-4 border-red-500 bg-white p-6 shadow-md">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
						<span class="font-bold text-red-600">💸</span>
					</div>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">Monthly Expenses</p>
					<p class="text-2xl font-bold text-gray-900">{formatCurrency(currentMonthExpenses)}</p>
				</div>
			</div>
		</div>

		<div class="rounded-lg border-l-4 border-blue-500 bg-white p-6 shadow-md">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
						<span class="font-bold text-blue-600">🏦</span>
					</div>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">Monthly Savings</p>
					<p
						class="text-2xl font-bold text-gray-900 {monthlySavings >= 0
							? 'text-green-600'
							: 'text-red-600'}"
					>
						{formatCurrency(monthlySavings)}
					</p>
				</div>
			</div>
		</div>

		<div class="rounded-lg border-l-4 border-purple-500 bg-white p-6 shadow-md">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
						<span class="font-bold text-purple-600">📊</span>
					</div>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">Savings Rate</p>
					<p class="text-2xl font-bold text-gray-900">
						{((monthlySavings / currentMonthIncome) * 100).toFixed(1)}%
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Charts Grid -->
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
		<!-- Monthly Income vs Expenses Trend -->
		<div class="rounded-lg bg-white p-6 shadow-lg">
			<FinanceChart
				type="line"
				data={trendChart}
				title="Monthly Income vs Expenses Trend"
				height="350px"
			/>
			<p class="mt-4 text-sm text-gray-600">
				Track your income and expense patterns over the past 12 months to identify trends and
				seasonal variations.
			</p>
		</div>

		<!-- Expense Breakdown by Category -->
		<div class="rounded-lg bg-white p-6 shadow-lg">
			<FinanceChart
				type="doughnut"
				data={expenseChart}
				title="Expenses by Category"
				height="350px"
			/>
			<p class="mt-4 text-sm text-gray-600">
				Visualize how your money is distributed across different spending categories this month.
			</p>
		</div>

		<!-- Budget vs Actual Comparison -->
		<div class="rounded-lg bg-white p-6 shadow-lg lg:col-span-2">
			<FinanceChart
				type="bar"
				data={budgetChart}
				title="Budget vs Actual Spending Comparison"
				height="400px"
			/>
			<p class="mt-4 text-sm text-gray-600">
				Compare your planned budget against actual spending to identify areas where you're over or
				under budget.
			</p>
		</div>
	</div>

	<!-- Chart Features -->
	<div class="rounded-lg bg-gray-50 p-8">
		<h2 class="mb-6 text-2xl font-bold text-gray-900">Chart Features</h2>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			<div class="rounded-lg bg-white p-6 shadow-sm">
				<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
					<span class="text-2xl">📊</span>
				</div>
				<h3 class="mb-2 text-lg font-semibold text-gray-900">Interactive Tooltips</h3>
				<p class="text-gray-600">
					Hover over chart elements to see detailed information with currency formatting and
					percentages.
				</p>
			</div>

			<div class="rounded-lg bg-white p-6 shadow-sm">
				<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
					<span class="text-2xl">📱</span>
				</div>
				<h3 class="mb-2 text-lg font-semibold text-gray-900">Responsive Design</h3>
				<p class="text-gray-600">
					Charts automatically adapt to different screen sizes and maintain readability on all
					devices.
				</p>
			</div>

			<div class="rounded-lg bg-white p-6 shadow-sm">
				<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
					<span class="text-2xl">🎨</span>
				</div>
				<h3 class="mb-2 text-lg font-semibold text-gray-900">Consistent Styling</h3>
				<p class="text-gray-600">
					Unified color palette and typography that matches your application's design system.
				</p>
			</div>

			<div class="rounded-lg bg-white p-6 shadow-sm">
				<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
					<span class="text-2xl">💰</span>
				</div>
				<h3 class="mb-2 text-lg font-semibold text-gray-900">Currency Formatting</h3>
				<p class="text-gray-600">
					Automatic currency formatting with locale-specific number formatting and symbols.
				</p>
			</div>

			<div class="rounded-lg bg-white p-6 shadow-sm">
				<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
					<span class="text-2xl">⚡</span>
				</div>
				<h3 class="mb-2 text-lg font-semibold text-gray-900">Real-time Updates</h3>
				<p class="text-gray-600">
					Charts automatically update when underlying data changes without requiring page refresh.
				</p>
			</div>

			<div class="rounded-lg bg-white p-6 shadow-sm">
				<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
					<span class="text-2xl">🔧</span>
				</div>
				<h3 class="mb-2 text-lg font-semibold text-gray-900">Customizable</h3>
				<p class="text-gray-600">
					Easily configurable chart types, colors, and options to fit your specific visualization
					needs.
				</p>
			</div>
		</div>
	</div>

	<!-- Navigation -->
	<div class="text-center">
		<a
			href="/"
			class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700"
		>
			← Back to Home
		</a>
	</div>
</div>

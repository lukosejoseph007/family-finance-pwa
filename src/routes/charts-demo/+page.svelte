<script lang="ts">
	import { PieChart, LineChart, BarChart, MultiLineChart, Card } from '$lib/components';

	// Sample data for demonstrations
	const pieChartData = [
		{ label: 'Food & Dining', value: 12500 },
		{ label: 'Transportation', value: 8200 },
		{ label: 'Entertainment', value: 4300 },
		{ label: 'Utilities', value: 6700 },
		{ label: 'Shopping', value: 9100 }
	];

	const lineChartData = [
		{ date: 'Jan 2024', income: 45000, expenses: 32000 },
		{ date: 'Feb 2024', income: 47000, expenses: 35000 },
		{ date: 'Mar 2024', income: 48000, expenses: 31000 },
		{ date: 'Apr 2024', income: 46000, expenses: 33000 },
		{ date: 'May 2024', income: 49000, expenses: 36000 },
		{ date: 'Jun 2024', income: 52000, expenses: 38000 }
	];

	const barChartData = [
		{ category: 'Food', budgeted: 12000, actual: 10500 },
		{ category: 'Transport', budgeted: 8000, actual: 8200 },
		{ category: 'Entertainment', budgeted: 5000, actual: 4300 },
		{ category: 'Utilities', budgeted: 7000, actual: 6700 }
	];

	const multiLineData = {
		series: [
			{
				label: 'Savings',
				color: '#22c55e',
				data: [
					{ x: 'Jan', y: 13000 },
					{ x: 'Feb', y: 12000 },
					{ x: 'Mar', y: 17000 },
					{ x: 'Apr', y: 13000 },
					{ x: 'May', y: 13000 },
					{ x: 'Jun', y: 14000 }
				]
			},
			{
				label: 'Investments',
				color: '#3b82f6',
				data: [
					{ x: 'Jan', y: 8000 },
					{ x: 'Feb', y: 9000 },
					{ x: 'Mar', y: 8500 },
					{ x: 'Apr', y: 9500 },
					{ x: 'May', y: 10000 },
					{ x: 'Jun', y: 11000 }
				]
			},
			{
				label: 'Emergency Fund',
				color: '#f59e0b',
				data: [
					{ x: 'Jan', y: 5000 },
					{ x: 'Feb', y: 5000 },
					{ x: 'Mar', y: 6000 },
					{ x: 'Apr', y: 6000 },
					{ x: 'May', y: 7000 },
					{ x: 'Jun', y: 8000 }
				]
			}
		]
	};
</script>

<svelte:head>
	<title>Charts Demo - LayerChart Components</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
	<div class="container mx-auto space-y-8 px-4 py-8">
		<!-- Header -->
		<div class="text-center">
			<h1 class="mb-4 text-4xl font-bold text-gray-900">LayerChart Components Demo</h1>
			<p class="text-lg text-gray-600">
				Interactive financial charts powered by LayerChart library
			</p>
		</div>

		<!-- Charts Grid -->
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
			<!-- Pie Chart Demo -->
			<Card class="p-6">
				<h2 class="mb-4 text-xl font-semibold text-gray-900">Pie Chart - Expense Breakdown</h2>
				<div class="h-80">
					<PieChart 
						data={pieChartData} 
						height={320}
						showTooltip={true}
						currency="INR"
					/>
				</div>
				<div class="mt-4 text-sm text-gray-600">
					<p><strong>Features:</strong> Interactive tooltips, responsive design, currency formatting</p>
				</div>
			</Card>

			<!-- Line Chart Demo -->
			<Card class="p-6">
				<h2 class="mb-4 text-xl font-semibold text-gray-900">Line Chart - Income vs Expenses</h2>
				<div class="h-80">
					<LineChart
						data={lineChartData}
						xKey="date"
						yKeys={["income", "expenses"]}
						height={320}
						showTooltip={true}
						currency="INR"
					/>
				</div>
				<div class="mt-4 text-sm text-gray-600">
					<p><strong>Features:</strong> Dual-line comparison, trend visualization, legend</p>
				</div>
			</Card>

			<!-- Bar Chart Demo -->
			<Card class="p-6">
				<h2 class="mb-4 text-xl font-semibold text-gray-900">Bar Chart - Budget vs Actual</h2>
				<div class="h-80">
					<BarChart
						data={barChartData}
						xKey="category"
						yKeys={["budgeted", "actual"]}
						height={320}
						showTooltip={true}
						currency="INR"
					/>
				</div>
				<div class="mt-4 text-sm text-gray-600">
					<p><strong>Features:</strong> Side-by-side comparison, category-based analysis</p>
				</div>
			</Card>

			<!-- Multi-Line Chart Demo -->
			<Card class="p-6">
				<h2 class="mb-4 text-xl font-semibold text-gray-900">Multi-Line Chart - Financial Goals</h2>
				<div class="h-80">
					<MultiLineChart 
						data={multiLineData}
						height={320}
						showTooltip={true}
						showLegend={true}
						currency="INR"
					/>
				</div>
				<div class="mt-4 text-sm text-gray-600">
					<p><strong>Features:</strong> Multiple data series, color coding, comprehensive legend</p>
				</div>
			</Card>
		</div>

		<!-- Technical Details -->
		<Card class="p-6">
			<h2 class="mb-4 text-xl font-semibold text-gray-900">Technical Implementation</h2>
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div>
					<h3 class="mb-2 font-medium text-gray-900">Chart Components</h3>
					<ul class="space-y-1 text-sm text-gray-600">
						<li>• <strong>PieChart</strong> - Category breakdowns and proportional data</li>
						<li>• <strong>LineChart</strong> - Trend analysis and time-series data</li>
						<li>• <strong>BarChart</strong> - Comparisons and categorical data</li>
						<li>• <strong>MultiLineChart</strong> - Multiple data series visualization</li>
					</ul>
				</div>
				<div>
					<h3 class="mb-2 font-medium text-gray-900">Features</h3>
					<ul class="space-y-1 text-sm text-gray-600">
						<li>• Interactive tooltips with currency formatting</li>
						<li>• Responsive design for all screen sizes</li>
						<li>• Consistent color schemes and styling</li>
						<li>• Accessible and keyboard-navigable</li>
						<li>• Powered by LayerChart library</li>
						<li>• Svelte 5 compatible with runes</li>
					</ul>
				</div>
			</div>
		</Card>

		<!-- Navigation -->
		<div class="pt-4 text-center">
			<a href="/dashboard" class="inline-flex items-center">
				<button class="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700">
					← Back to Dashboard
				</button>
			</a>
		</div>
	</div>
</div>

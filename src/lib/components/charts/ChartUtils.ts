// LayerChart utilities for financial data visualization
// Optimized for LayerChart library with proper data transformation

// Color palette optimized for financial data visualization
export const CHART_COLORS = {
	primary: '#3b82f6',
	income: '#10b981',
	expense: '#ef4444',
	budget: '#8b5cf6',
	actual: '#f59e0b',
	neutral: '#6b7280',
	expenses: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4']
};

// Legacy interface for backward compatibility
export interface LayerChartSeries {
	label: string;
	data: { x: string; y: number }[];
	color: string;
}

export interface LayerChartData {
	series: LayerChartSeries[];
}

// Transform financial data for LineChart component
export function createIncomeVsExpenseData(data: { date: string; income: number; expenses: number }[]) {
	return data.map(item => ({
		date: new Date(item.date),
		income: item.income,
		expenses: Math.abs(item.expenses) // Ensure expenses are positive for display
	}));
}

// Transform category spending data for PieChart component
export function createExpensePieData(data: { category_name: string; spent_amount: number }[]) {
	return data
		.filter(item => item.spent_amount > 0)
		.map((item, index) => ({
			label: item.category_name,
			value: item.spent_amount,
			color: CHART_COLORS.expenses[index % CHART_COLORS.expenses.length]
		}));
}

// Transform budget comparison data for BarChart component
export function createBudgetComparisonData(data: { category_name: string; budgeted_amount: number; spent_amount: number }[]) {
	return data
		.filter(item => item.budgeted_amount > 0 || item.spent_amount > 0)
		.map(item => ({
			category: item.category_name,
			budgeted: item.budgeted_amount,
			spent: item.spent_amount
		}));
}

// Transform net worth trend data for LineChart component
export function createNetWorthTrendData(data: { date: string; assets: number; liabilities: number; net_worth: number }[]) {
	return data.map(item => ({
		date: new Date(item.date),
		assets: item.assets,
		liabilities: item.liabilities,
		netWorth: item.net_worth
	}));
}

// Transform spending trends data for MultiLineChart component
export function createSpendingTrendsData(data: { month_year: string; category_type: string; amount: number }[]) {
	// Group by category type
	const groupedData = new Map<string, { date: Date; value: number }[]>();
	
	data.forEach(item => {
		const [year, month] = item.month_year.split('-');
		const date = new Date(parseInt(year), parseInt(month) - 1, 1);
		
		if (!groupedData.has(item.category_type)) {
			groupedData.set(item.category_type, []);
		}
		
		groupedData.get(item.category_type)!.push({
			date,
			value: item.amount
		});
	});

	// Convert to format expected by LineChart with multiple series
	const allDates = Array.from(new Set(data.map(item => item.month_year))).sort();
	
	return allDates.map(monthYear => {
		const [year, month] = monthYear.split('-');
		const date = new Date(parseInt(year), parseInt(month) - 1, 1);
		
		const result: Record<string, number | Date> = { date };
		
		// Add each category type as a separate field
		groupedData.forEach((values, categoryType) => {
			const found = values.find(v => 
				v.date.getFullYear() === date.getFullYear() && 
				v.date.getMonth() === date.getMonth()
			);
			result[categoryType] = found ? found.value : 0;
		});
		
		return result;
	});
}

// Legacy compatibility functions (for backward compatibility with existing dashboard code)
function generateMonthLabels(count: number): string[] {
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const currentMonth = new Date().getMonth();
	return Array.from({ length: count }, (_, i) => 
		months[(currentMonth - count + 1 + i + 12) % 12]
	);
}

export function createMonthlyTrend(incomeData: number[], expenseData: number[], labels?: string[]) {
	const finalLabels = labels || generateMonthLabels(incomeData.length);
	return finalLabels.map((label, i) => ({
		date: label,
		income: incomeData[i] || 0,
		expenses: expenseData[i] || 0
	}));
}

export function createExpenseByCategory(categories: string[], amounts: number[]) {
	return categories.map((category, i) => ({
		category_name: category,
		spent_amount: amounts[i] || 0
	}));
}

export function createBudgetComparison(categories: string[], budgetData: number[], actualData: number[]) {
	return categories.map((category, i) => ({
		category_name: category,
		budgeted_amount: budgetData[i] || 0,
		spent_amount: actualData[i] || 0
	}));
}

export function createCategoryDistribution(categories: string[], amounts: number[]): LayerChartData {
	return {
		series: [
			{
				label: 'Distribution',
				data: categories.map((category: string, i: number) => ({ x: category, y: amounts[i] })),
				color: CHART_COLORS.primary
			}
		]
	};
}

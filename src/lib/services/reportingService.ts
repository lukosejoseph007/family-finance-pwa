import { supabase } from '$lib/supabaseClient';
import { getTransactionSummary } from './transactionService';
import { getBudgetSummary } from './budgetService';
import { getAccountSummary } from './accountService';
import { getCurrentMonth } from './budgetService';

export interface MonthlyReport {
	month_year: string;
	income: number;
	expenses: number;
	net_amount: number;
	budget_allocated: number;
	budget_remaining: number;
	accounts_balance: number;
	transaction_count: number;
}

export interface CategorySpendingReport {
	category_id: string;
	category_name: string;
	category_type: string;
	budgeted_amount: number;
	spent_amount: number;
	remaining_amount: number;
	percentage_used: number;
	transaction_count: number;
}

export interface NetWorthTrend {
	date: string;
	assets: number;
	liabilities: number;
	net_worth: number;
}

export interface SpendingTrend {
	month_year: string;
	category_type: string;
	amount: number;
}

// Get comprehensive monthly financial report
export async function getMonthlyReport(monthYear: string): Promise<MonthlyReport> {
	const [transactionSummary, budgetSummary, accountSummary] = await Promise.all([
		getTransactionSummary({
			date_from: `${monthYear}-01`,
			date_to: getEndOfMonth(monthYear)
		}),
		getBudgetSummary(monthYear),
		getAccountSummary()
	]);

	return {
		month_year: monthYear,
		income: transactionSummary.total_income,
		expenses: transactionSummary.total_expenses,
		net_amount: transactionSummary.net_amount,
		budget_allocated: budgetSummary.total_expenses_budgeted,
		budget_remaining: budgetSummary.total_available,
		accounts_balance: accountSummary.net_worth,
		transaction_count: transactionSummary.transaction_count
	};
}

// Get category spending analysis for current month
export async function getCategorySpendingReport(
	monthYear: string = getCurrentMonth()
): Promise<CategorySpendingReport[]> {
	const { data, error } = await supabase
		.from('budgets')
		.select(
			`
			category_id,
			allocated_amount,
			spent_amount,
			available_amount,
			category:categories(name, type)
		`
		)
		.eq('month_year', monthYear);

	if (error) {
		throw new Error(`Failed to fetch category spending report: ${error.message}`);
	}

	// Get transaction counts per category
	const { data: transactionCounts, error: countError } = await supabase
		.from('transactions')
		.select('category_id')
		.gte('transaction_date', `${monthYear}-01`)
		.lt('transaction_date', getNextMonthDate(monthYear));

	if (countError) {
		throw new Error(`Failed to fetch transaction counts: ${countError.message}`);
	}

	const transactionCountMap = new Map<string, number>();
	(transactionCounts || []).forEach((t) => {
		if (t.category_id) {
			transactionCountMap.set(t.category_id, (transactionCountMap.get(t.category_id) || 0) + 1);
		}
	});

	return (data || []).map((budget) => ({
		category_id: budget.category_id,
		category_name: (budget.category && 'name' in budget.category
			? budget.category.name
			: 'Unknown') as string,
		category_type: (budget.category && 'type' in budget.category
			? budget.category.type
			: 'unknown') as string,
		budgeted_amount: budget.allocated_amount,
		spent_amount: budget.spent_amount,
		remaining_amount: budget.available_amount,
		percentage_used:
			budget.allocated_amount > 0 ? (budget.spent_amount / budget.allocated_amount) * 100 : 0,
		transaction_count: transactionCountMap.get(budget.category_id) || 0
	}));
}

// Get net worth trend over time (last 12 months)
export async function getNetWorthTrend(): Promise<NetWorthTrend[]> {
	const trends: NetWorthTrend[] = [];
	const currentDate = new Date();

	// Get account balance history for last 12 months
	for (let i = 11; i >= 0; i--) {
		const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
		const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
		const endDate = getEndOfMonth(monthYear);

		// Calculate net worth at end of month by summing transactions up to that point
		const { data: accounts, error } = await supabase
			.from('accounts')
			.select('id, type, balance')
			.eq('is_active', true);

		if (error) continue;

		let assets = 0;
		let liabilities = 0;

		// For simplicity, we'll use current account balances
		// In a real system, you'd store historical balance snapshots
		(accounts || []).forEach((account) => {
			if (['checking', 'savings', 'cash', 'investment'].includes(account.type)) {
				assets += account.balance;
			} else if (['credit_card', 'loan'].includes(account.type)) {
				liabilities += Math.abs(account.balance);
			}
		});

		trends.push({
			date: endDate,
			assets,
			liabilities,
			net_worth: assets - liabilities
		});
	}

	return trends;
}

// Get spending trends by category type over last 12 months
export async function getSpendingTrends(): Promise<SpendingTrend[]> {
	const trends: SpendingTrend[] = [];
	const currentDate = new Date();

	for (let i = 11; i >= 0; i--) {
		const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
		const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

		// Get spending by category type for this month
		const { data, error } = await supabase
			.from('transactions')
			.select(
				`
				amount,
				category:categories(type)
			`
			)
			.gte('transaction_date', `${monthYear}-01`)
			.lt('transaction_date', getNextMonthDate(monthYear))
			.lt('amount', 0); // Only expenses (negative amounts)

		if (error) continue;

		const spendingByType = new Map<string, number>();
		(data || []).forEach((transaction) => {
			const categoryType = transaction.category?.[0]?.type || 'uncategorized';
			const amount = Math.abs(transaction.amount);
			spendingByType.set(categoryType, (spendingByType.get(categoryType) || 0) + amount);
		});

		spendingByType.forEach((amount, categoryType) => {
			trends.push({
				month_year: monthYear,
				category_type: categoryType,
				amount
			});
		});
	}

	return trends;
}

// Get budget performance overview
export async function getBudgetPerformance(monthYear: string = getCurrentMonth()): Promise<{
	on_track_categories: number;
	over_budget_categories: number;
	under_budget_categories: number;
	total_variance: number;
	performance_score: number;
}> {
	const categoryReport = await getCategorySpendingReport(monthYear);

	let onTrack = 0;
	let overBudget = 0;
	let underBudget = 0;
	let totalVariance = 0;

	categoryReport.forEach((category) => {
		const variance = category.spent_amount - category.budgeted_amount;
		totalVariance += Math.abs(variance);

		if (category.percentage_used > 100) {
			overBudget++;
		} else if (category.percentage_used >= 80) {
			onTrack++;
		} else {
			underBudget++;
		}
	});

	const totalCategories = categoryReport.length;
	const performanceScore =
		totalCategories > 0 ? ((onTrack + underBudget) / totalCategories) * 100 : 100;

	return {
		on_track_categories: onTrack,
		over_budget_categories: overBudget,
		under_budget_categories: underBudget,
		total_variance: totalVariance,
		performance_score: Math.round(performanceScore)
	};
}

// Get account balance distribution
export async function getAccountBalanceDistribution(): Promise<
	{
		account_id: string;
		account_name: string;
		account_type: string;
		balance: number;
		percentage: number;
	}[]
> {
	const accountSummary = await getAccountSummary();
	const totalAssets = accountSummary.total_assets;

	const { data: accounts, error } = await supabase
		.from('accounts')
		.select('id, name, type, balance')
		.eq('is_active', true)
		.gt('balance', 0); // Only positive balances for distribution

	if (error) {
		throw new Error(`Failed to fetch account distribution: ${error.message}`);
	}

	return (accounts || []).map((account) => ({
		account_id: account.id,
		account_name: account.name,
		account_type: account.type,
		balance: account.balance,
		percentage: totalAssets > 0 ? (account.balance / totalAssets) * 100 : 0
	}));
}

// Get recent financial milestones
export async function getFinancialMilestones(): Promise<
	{
		type: 'budget_achieved' | 'savings_goal' | 'debt_reduction' | 'net_worth_increase';
		title: string;
		description: string;
		amount?: number;
		date: string;
	}[]
> {
	const milestones = [];
	const currentMonth = getCurrentMonth();
	const lastMonth = getPreviousMonth(currentMonth);

	// Check budget achievements
	const currentBudgetPerf = await getBudgetPerformance(currentMonth);
	if (currentBudgetPerf.performance_score >= 90) {
		milestones.push({
			type: 'budget_achieved' as const,
			title: 'Excellent Budget Performance!',
			description: `You stayed on track with ${currentBudgetPerf.performance_score}% of your budget categories this month.`,
			date: new Date().toISOString()
		});
	}

	// Check net worth increase
	try {
		const [currentReport, lastReport] = await Promise.all([
			getMonthlyReport(currentMonth),
			getMonthlyReport(lastMonth)
		]);

		if (currentReport.accounts_balance > lastReport.accounts_balance) {
			const increase = currentReport.accounts_balance - lastReport.accounts_balance;
			milestones.push({
				type: 'net_worth_increase' as const,
				title: 'Net Worth Increased!',
				description: `Your family's net worth grew this month.`,
				amount: increase,
				date: new Date().toISOString()
			});
		}
	} catch {
		// Ignore errors for milestone calculation
	}

	return milestones.slice(0, 5); // Return top 5 milestones
}



// Helper functions

// Get historical monthly reports for specified number of months
export async function getHistoricalReports(months: number = 6): Promise<MonthlyReport[]> {
	const reports: MonthlyReport[] = [];
	for (let i = months - 1; i >= 0; i--) {
		const month = new Date();
		month.setMonth(month.getMonth() - i);
		const monthYear = `${month.getFullYear()}-${(month.getMonth() + 1).toString().padStart(2, '0')}`;
		
		try {
			const report = await getMonthlyReport(monthYear);
			reports.push(report);
		} catch (error) {
			console.error(`Failed to fetch report for ${monthYear}:`, error);
		}
	}
	
	return reports;
}


// Get historical monthly reports for specified number of months
function getEndOfMonth(monthYear: string): string {
	const [year, month] = monthYear.split('-').map(Number);
	const lastDay = new Date(year, month, 0).getDate();
	return `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
}

function getNextMonthDate(monthYear: string): string {
	const [year, month] = monthYear.split('-').map(Number);
	const nextMonth = month === 12 ? 1 : month + 1;
	const nextYear = month === 12 ? year + 1 : year;
	return `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
}

function getPreviousMonth(monthYear: string): string {
	const [year, month] = monthYear.split('-').map(Number);
	const prevMonth = month === 1 ? 12 : month - 1;
	const prevYear = month === 1 ? year - 1 : year;
	return `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;
}

// Export data for external analysis
export async function exportFinancialData(options: {
	start_date: string;
	end_date: string;
	include_transactions?: boolean;
	include_budgets?: boolean;
	include_accounts?: boolean;
}) {
	const exportData: Record<string, unknown> = {
		generated_at: new Date().toISOString(),
		period: {
			start: options.start_date,
			end: options.end_date
		}
	};

	if (options.include_transactions) {
		const { data: transactions } = await supabase
			.from('transactions')
			.select(
				`
				*,
				account:accounts(name, type),
				category:categories(name, type)
			`
			)
			.gte('transaction_date', options.start_date)
			.lte('transaction_date', options.end_date)
			.order('transaction_date', { ascending: false });

		exportData.transactions = transactions;
	}

	if (options.include_budgets) {
		const startMonth = options.start_date.substring(0, 7);
		const endMonth = options.end_date.substring(0, 7);

		const { data: budgets } = await supabase
			.from('budgets')
			.select(
				`
				*,
				category:categories(name, type)
			`
			)
			.gte('month_year', startMonth)
			.lte('month_year', endMonth);

		exportData.budgets = budgets;
	}

	if (options.include_accounts) {
		const { data: accounts } = await supabase.from('accounts').select('*');

		exportData.accounts = accounts;
	}

	return exportData;
}

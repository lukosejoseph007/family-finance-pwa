import { supabase } from '$lib/supabaseClient';
import type { Budget, BudgetFormData } from '$lib/types';

// Budget allocation functions for YNAB Rule 1: Give Every Rupee a Job
export async function getBudgetForMonth(monthYear: string): Promise<Budget[]> {
	const { data, error } = await supabase
		.from('budgets')
		.select(
			`
			*,
			category:categories(id, name, type, description)
		`
		)
		.eq('month_year', monthYear)
		.order('created_at', { ascending: true });

	if (error) {
		throw new Error(`Failed to fetch budget for ${monthYear}: ${error.message}`);
	}

	return data || [];
}

export async function createOrUpdateBudget(budgetData: BudgetFormData): Promise<Budget> {
	const allocatedAmount = parseFloat(budgetData.allocated_amount);

	// Check if budget already exists for this category and month
	const { data: existingBudget, error: checkError } = await supabase
		.from('budgets')
		.select('id, allocated_amount, spent_amount')
		.eq('category_id', budgetData.category_id)
		.eq('month_year', budgetData.month_year)
		.single();

	if (checkError && checkError.code !== 'PGRST116') {
		// PGRST116 = no rows found
		throw new Error(`Failed to check existing budget: ${checkError.message}`);
	}

	// Calculate available amount (allocated - spent)
	const spentAmount = existingBudget?.spent_amount || 0;
	const availableAmount = allocatedAmount - spentAmount;

	let result;
	if (existingBudget) {
		// Update existing budget
		const { data, error } = await supabase
			.from('budgets')
			.update({
				allocated_amount: allocatedAmount,
				available_amount: availableAmount,
				updated_at: new Date().toISOString()
			})
			.eq('id', existingBudget.id)
			.select(
				`
				*,
				category:categories(id, name, type, description)
			`
			)
			.single();

		if (error) {
			throw new Error(`Failed to update budget: ${error.message}`);
		}
		result = data;
	} else {
		// Create new budget
		const { data, error } = await supabase
			.from('budgets')
			.insert([
				{
					category_id: budgetData.category_id,
					month_year: budgetData.month_year,
					allocated_amount: allocatedAmount,
					spent_amount: 0,
					available_amount: allocatedAmount
				}
			])
			.select(
				`
				*,
				category:categories(id, name, type, description)
			`
			)
			.single();

		if (error) {
			throw new Error(`Failed to create budget: ${error.message}`);
		}
		result = data;
	}

	return result;
}

export async function updateBudgetSpent(
	categoryId: string,
	monthYear: string,
	spentChange: number
): Promise<void> {
	// Get current budget
	const { data: budget, error: fetchError } = await supabase
		.from('budgets')
		.select('allocated_amount, spent_amount')
		.eq('category_id', categoryId)
		.eq('month_year', monthYear)
		.single();

	if (fetchError) {
		// If no budget exists, create one with 0 allocated amount
		if (fetchError.code === 'PGRST116') {
			const newSpentAmount = Math.max(0, spentChange);
			await supabase.from('budgets').insert([
				{
					category_id: categoryId,
					month_year: monthYear,
					allocated_amount: 0,
					spent_amount: newSpentAmount,
					available_amount: -newSpentAmount
				}
			]);
			return;
		}
		throw new Error(`Failed to fetch budget for update: ${fetchError.message}`);
	}

	const newSpentAmount = Math.max(0, budget.spent_amount + spentChange);
	const newAvailableAmount = budget.allocated_amount - newSpentAmount;

	const { error } = await supabase
		.from('budgets')
		.update({
			spent_amount: newSpentAmount,
			available_amount: newAvailableAmount,
			updated_at: new Date().toISOString()
		})
		.eq('category_id', categoryId)
		.eq('month_year', monthYear);

	if (error) {
		throw new Error(`Failed to update budget spent amount: ${error.message}`);
	}
}

export async function getBudgetSummary(monthYear: string): Promise<{
	total_income_budgeted: number;
	total_expenses_budgeted: number;
	total_spent: number;
	total_available: number;
	unallocated_income: number;
	category_count: number;
	overspent_categories: number;
}> {
	// Get budget data with category types
	const { data: budgets, error: budgetError } = await supabase
		.from('budgets')
		.select(
			`
			allocated_amount,
			spent_amount,
			available_amount,
			category:categories(type)
		`
		)
		.eq('month_year', monthYear);

	if (budgetError) {
		throw new Error(`Failed to fetch budget summary: ${budgetError.message}`);
	}

	// Get actual income for the month from transactions
	const { data: incomeTransactions, error: incomeError } = await supabase
		.from('transactions')
		.select(
			`
			amount,
			category:categories(type)
		`
		)
		.gte('transaction_date', `${monthYear}-01`)
		.lt('transaction_date', getNextMonthDate(monthYear));

	if (incomeError) {
		throw new Error(`Failed to fetch income transactions: ${incomeError.message}`);
	}

	const budgetList = budgets || [];
	const transactions = incomeTransactions || [];

	// Calculate actual income from transactions
	const actualIncome = transactions
		.filter((t) => t.category && 'type' in t.category && t.category.type === 'income')
		.reduce((sum, t) => sum + t.amount, 0);

	// Calculate budget totals
	const incomeBudgets = budgetList.filter(
		(b) => b.category && 'type' in b.category && b.category.type === 'income'
	);
	const expenseBudgets = budgetList.filter(
		(b) => b.category && 'type' in b.category && b.category.type !== 'income'
	);

	const total_income_budgeted = incomeBudgets.reduce((sum, b) => sum + b.allocated_amount, 0);
	const total_expenses_budgeted = expenseBudgets.reduce((sum, b) => sum + b.allocated_amount, 0);
	const total_spent = budgetList.reduce((sum, b) => sum + b.spent_amount, 0);
	const total_available = budgetList.reduce((sum, b) => sum + b.available_amount, 0);

	// Use actual income vs budgeted expenses for unallocated calculation
	const incomeToAllocate = Math.max(actualIncome, total_income_budgeted);
	const unallocated_income = incomeToAllocate - total_expenses_budgeted;

	const category_count = budgetList.length;
	const overspent_categories = budgetList.filter((b) => b.available_amount < 0).length;

	return {
		total_income_budgeted,
		total_expenses_budgeted,
		total_spent,
		total_available,
		unallocated_income,
		category_count,
		overspent_categories
	};
}

export async function initializeBudgetForMonth(monthYear: string): Promise<void> {
	// Get all active categories
	const { data: categories, error: categoriesError } = await supabase
		.from('categories')
		.select('id, name, type, budget_amount')
		.eq('is_active', true);

	if (categoriesError) {
		throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
	}

	// Check which categories already have budgets for this month
	const { data: existingBudgets, error: budgetError } = await supabase
		.from('budgets')
		.select('category_id')
		.eq('month_year', monthYear);

	if (budgetError) {
		throw new Error(`Failed to check existing budgets: ${budgetError.message}`);
	}

	const existingCategoryIds = new Set(existingBudgets?.map((b) => b.category_id) || []);
	const categoriesToCreate = (categories || [])
		.filter((cat) => !existingCategoryIds.has(cat.id))
		.filter((cat) => cat.type !== 'income'); // Don't auto-create income budgets

	if (categoriesToCreate.length === 0) {
		return; // All budgets already exist
	}

	// Create budget entries for missing categories
	const budgetsToInsert = categoriesToCreate.map((category) => ({
		category_id: category.id,
		month_year: monthYear,
		allocated_amount: category.budget_amount || 0,
		spent_amount: 0,
		available_amount: category.budget_amount || 0
	}));

	const { error: insertError } = await supabase.from('budgets').insert(budgetsToInsert);

	if (insertError) {
		throw new Error(`Failed to initialize budget: ${insertError.message}`);
	}
}

export async function moveMoney(
	fromCategoryId: string,
	toCategoryId: string,
	amount: number,
	monthYear: string
): Promise<void> {
	// Get both budgets
	const { data: budgets, error } = await supabase
		.from('budgets')
		.select('id, category_id, allocated_amount, spent_amount, available_amount')
		.eq('month_year', monthYear)
		.in('category_id', [fromCategoryId, toCategoryId]);

	if (error) {
		throw new Error(`Failed to fetch budgets for money move: ${error.message}`);
	}

	const fromBudget = budgets?.find((b) => b.category_id === fromCategoryId);
	const toBudget = budgets?.find((b) => b.category_id === toCategoryId);

	if (!fromBudget || !toBudget) {
		throw new Error('One or both budget categories not found');
	}

	if (fromBudget.available_amount < amount) {
		throw new Error('Insufficient available funds in source category');
	}

	// Update both budgets
	const updates = [
		{
			id: fromBudget.id,
			allocated_amount: fromBudget.allocated_amount - amount,
			available_amount: fromBudget.available_amount - amount
		},
		{
			id: toBudget.id,
			allocated_amount: toBudget.allocated_amount + amount,
			available_amount: toBudget.available_amount + amount
		}
	];

	for (const update of updates) {
		const { error: updateError } = await supabase
			.from('budgets')
			.update({
				allocated_amount: update.allocated_amount,
				available_amount: update.available_amount,
				updated_at: new Date().toISOString()
			})
			.eq('id', update.id);

		if (updateError) {
			throw new Error(`Failed to update budget: ${updateError.message}`);
		}
	}
}

export async function copyBudgetFromPreviousMonth(monthYear: string): Promise<void> {
	const previousMonth = getPreviousMonthDate(monthYear);

	// Get previous month's budget
	const { data: previousBudgets, error: fetchError } = await supabase
		.from('budgets')
		.select('category_id, allocated_amount')
		.eq('month_year', previousMonth);

	if (fetchError) {
		throw new Error(`Failed to fetch previous month budget: ${fetchError.message}`);
	}

	if (!previousBudgets || previousBudgets.length === 0) {
		throw new Error('No budget found for previous month');
	}

	// Check for existing budgets in current month
	const { data: existingBudgets, error: checkError } = await supabase
		.from('budgets')
		.select('category_id')
		.eq('month_year', monthYear);

	if (checkError) {
		throw new Error(`Failed to check existing budgets: ${checkError.message}`);
	}

	const existingCategoryIds = new Set(existingBudgets?.map((b) => b.category_id) || []);
	const budgetsToCreate = previousBudgets.filter((b) => !existingCategoryIds.has(b.category_id));

	if (budgetsToCreate.length === 0) {
		return; // All budgets already exist
	}

	// Create new budget entries
	const budgetsToInsert = budgetsToCreate.map((budget) => ({
		category_id: budget.category_id,
		month_year: monthYear,
		allocated_amount: budget.allocated_amount,
		spent_amount: 0,
		available_amount: budget.allocated_amount
	}));

	const { error: insertError } = await supabase.from('budgets').insert(budgetsToInsert);

	if (insertError) {
		throw new Error(`Failed to copy budget from previous month: ${insertError.message}`);
	}
}

// Helper functions
function getNextMonthDate(monthYear: string): string {
	const [year, month] = monthYear.split('-').map(Number);
	const nextMonth = month === 12 ? 1 : month + 1;
	const nextYear = month === 12 ? year + 1 : year;
	return `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
}

function getPreviousMonthDate(monthYear: string): string {
	const [year, month] = monthYear.split('-').map(Number);
	const prevMonth = month === 1 ? 12 : month - 1;
	const prevYear = month === 1 ? year - 1 : year;
	return `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;
}

// Budget validation
export function validateBudgetData(data: BudgetFormData): string[] {
	const errors: string[] = [];

	if (!data.category_id) {
		errors.push('Category is required');
	}

	if (!data.month_year) {
		errors.push('Month is required');
	}

	if (
		!data.allocated_amount ||
		(typeof data.allocated_amount === 'string' && data.allocated_amount.trim().length === 0)
	) {
		errors.push('Allocated amount is required');
	}

	if (data.allocated_amount && isNaN(parseFloat(data.allocated_amount))) {
		errors.push('Allocated amount must be a valid number');
	}

	if (data.allocated_amount && parseFloat(data.allocated_amount) < 0) {
		errors.push('Allocated amount cannot be negative');
	}

	return errors;
}

// Get current month in YYYY-MM format
export function getCurrentMonth(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = (now.getMonth() + 1).toString().padStart(2, '0');
	return `${year}-${month}`;
}

// Format month for display
export function formatMonthDisplay(monthYear: string): string {
	const [year, month] = monthYear.split('-');
	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];
	return `${monthNames[parseInt(month) - 1]} ${year}`;
}

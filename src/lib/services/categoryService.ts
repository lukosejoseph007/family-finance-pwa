import { supabase } from '$lib/supabaseClient';
import type { Category, CategoryFormData, CategoryType } from '$lib/types';

// Default YNAB category structure optimized for Indian families
export const defaultCategories = {
	immediate_obligations: [
		{ name: 'Rent/EMI', description: 'Monthly rent or home loan EMI' },
		{ name: 'Utilities', description: 'Electricity, water, gas, internet bills' },
		{ name: 'Groceries', description: 'Monthly grocery and household items' },
		{ name: 'Transportation', description: 'Petrol, auto/taxi fares, metro/bus passes' },
		{ name: 'Phone Bills', description: 'Mobile and landline phone bills' },
		{ name: 'Insurance Premiums', description: 'Health, life, vehicle insurance' },
		{ name: 'Loan Payments', description: 'Personal loans, credit card minimum payments' }
	],
	true_expenses: [
		{ name: 'Vehicle Maintenance', description: 'Car/bike servicing, repairs' },
		{ name: 'Home Maintenance', description: 'House repairs, painting, cleaning' },
		{ name: 'Medical & Health', description: 'Doctor visits, medicines, health checkups' },
		{ name: 'Education', description: 'School fees, tuition, books, courses' },
		{ name: 'Festival & Gifts', description: 'Diwali, wedding gifts, celebrations' },
		{ name: 'Clothing', description: 'New clothes for family members' },
		{ name: 'Annual Subscriptions', description: 'Netflix, Amazon Prime, gym membership' }
	],
	quality_of_life: [
		{ name: 'Dining Out', description: 'Restaurant meals, food delivery' },
		{ name: 'Entertainment', description: 'Movies, gaming, hobbies' },
		{ name: 'Travel & Vacation', description: 'Family trips, holiday expenses' },
		{ name: 'Personal Care', description: 'Salon, spa, personal grooming' },
		{ name: 'Pocket Money', description: 'Children allowances, personal spending' },
		{ name: 'Books & Learning', description: 'Books, online courses, skill development' },
		{ name: 'Charity & Donations', description: 'Religious donations, charity contributions' }
	],
	just_for_fun: [
		{ name: 'Shopping', description: 'Non-essential shopping and impulse purchases' },
		{ name: 'Games & Apps', description: 'Mobile games, app purchases' },
		{ name: 'Social Activities', description: 'Parties, social events, celebrations' },
		{ name: 'Hobbies', description: 'Photography, art, music, sports equipment' }
	],
	income: [
		{ name: 'Salary', description: 'Primary employment income' },
		{ name: 'Freelance', description: 'Freelance and consulting income' },
		{ name: 'Business Income', description: 'Business and entrepreneurial income' },
		{ name: 'Investment Returns', description: 'Dividends, interest, capital gains' },
		{ name: 'Other Income', description: 'Rental income, gifts, bonuses' }
	]
};

// Category type labels and icons
export const categoryTypeLabels: Record<CategoryType, string> = {
	immediate_obligations: 'Immediate Obligations',
	true_expenses: 'True Expenses',
	quality_of_life: 'Quality of Life Goals',
	just_for_fun: 'Just for Fun',
	income: 'Income'
};

export const categoryTypeIcons: Record<CategoryType, string> = {
	immediate_obligations: '🔴',
	true_expenses: '🟡',
	quality_of_life: '🟢',
	just_for_fun: '🎉',
	income: '💰'
};

export const categoryTypeColors: Record<CategoryType, string> = {
	immediate_obligations: 'red',
	true_expenses: 'yellow',
	quality_of_life: 'green',
	just_for_fun: 'purple',
	income: 'blue'
};

// Category management functions - Get all categories (including archived)
export async function getCategories(): Promise<Category[]> {
	const { data: authUser, error: authError } = await supabase.auth.getUser();

	if (authError || !authUser.user) {
		throw new Error('User not authenticated');
	}

	// Get user's family_id
	const { data: user, error: userError } = await supabase
		.from('users')
		.select('family_id')
		.eq('id', authUser.user.id)
		.single();

	if (userError || !user?.family_id) {
		console.warn('User family not found, returning empty categories');
		return [];
	}

	const { data, error } = await supabase
		.from('categories')
		.select('*')
		.eq('family_id', user.family_id)
		.order('type', { ascending: true })
		.order('name', { ascending: true });

	if (error) {
		throw new Error(`Failed to fetch categories: ${error.message}`);
	}

	return data || [];
}

// Get only active categories
export async function getActiveCategories(): Promise<Category[]> {
	const { data: authUser, error: authError } = await supabase.auth.getUser();

	if (authError || !authUser.user) {
		throw new Error('User not authenticated');
	}

	// Get user's family_id
	const { data: user, error: userError } = await supabase
		.from('users')
		.select('family_id')
		.eq('id', authUser.user.id)
		.single();

	if (userError || !user?.family_id) {
		console.warn('User family not found, returning empty categories');
		return [];
	}

	const { data, error } = await supabase
		.from('categories')
		.select('*')
		.eq('family_id', user.family_id)
		.eq('is_active', true)
		.order('type', { ascending: true })
		.order('name', { ascending: true });

	if (error) {
		throw new Error(`Failed to fetch active categories: ${error.message}`);
	}

	return data || [];
}

export async function createCategory(categoryData: CategoryFormData): Promise<Category> {
	const { data: authUser, error: authError } = await supabase.auth.getUser();

	if (authError || !authUser.user) {
		throw new Error('User not authenticated');
	}

	// Get user's family_id
	const { data: user, error: userError } = await supabase
		.from('users')
		.select('family_id')
		.eq('id', authUser.user.id)
		.single();

	if (userError || !user?.family_id) {
		throw new Error('User family not found');
	}

	const { data, error } = await supabase
		.from('categories')
		.insert([
			{
				family_id: user.family_id,
				name: categoryData.name,
				type: categoryData.type,
				description: categoryData.description,
				budget_amount: parseFloat(categoryData.budget_amount || '0'),
				is_active: true
			}
		])
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to create category: ${error.message}`);
	}

	return data;
}

export async function updateCategory(
	id: string,
	categoryData: CategoryFormData
): Promise<Category> {
	const { data, error } = await supabase
		.from('categories')
		.update({
			name: categoryData.name,
			type: categoryData.type,
			description: categoryData.description,
			budget_amount: parseFloat(categoryData.budget_amount || '0')
		})
		.eq('id', id)
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to update category: ${error.message}`);
	}

	return data;
}

export async function archiveCategory(id: string): Promise<void> {
	const { error } = await supabase.from('categories').update({ is_active: false }).eq('id', id);

	if (error) {
		throw new Error(`Failed to archive category: ${error.message}`);
	}
}

// Hard delete category (completely remove)
export async function deleteCategory(id: string): Promise<void> {
	// Check if category has transactions or budgets
	const { count: transactionCount } = await supabase
		.from('transactions')
		.select('*', { count: 'exact', head: true })
		.eq('category_id', id);

	const { count: budgetCount } = await supabase
		.from('budgets')
		.select('*', { count: 'exact', head: true })
		.eq('category_id', id);

	if ((transactionCount && transactionCount > 0) || (budgetCount && budgetCount > 0)) {
		throw new Error(
			'Cannot delete category with existing transactions or budgets. Archive it instead.'
		);
	}

	// Permanently delete the category
	const { error } = await supabase.from('categories').delete().eq('id', id);

	if (error) {
		throw new Error(`Failed to delete category: ${error.message}`);
	}
}

export async function reactivateCategory(id: string): Promise<void> {
	const { error } = await supabase.from('categories').update({ is_active: true }).eq('id', id);

	if (error) {
		throw new Error(`Failed to reactivate category: ${error.message}`);
	}
}

export async function getCategorySummary(): Promise<{
	total_budget: number;
	allocated_amount: number;
	category_count: number;
	by_type: Record<CategoryType, { count: number; budget: number }>;
}> {
	const { data, error } = await supabase
		.from('categories')
		.select('type, budget_amount')
		.eq('is_active', true);

	if (error) {
		throw new Error(`Failed to fetch category summary: ${error.message}`);
	}

	const categories = data || [];
	const total_budget = categories.reduce((sum, cat) => sum + (cat.budget_amount || 0), 0);
	const category_count = categories.length;

	const by_type: Record<CategoryType, { count: number; budget: number }> = {
		immediate_obligations: { count: 0, budget: 0 },
		true_expenses: { count: 0, budget: 0 },
		quality_of_life: { count: 0, budget: 0 },
		just_for_fun: { count: 0, budget: 0 },
		income: { count: 0, budget: 0 }
	};

	categories.forEach((cat) => {
		const categoryType = cat.type as CategoryType;
		if (by_type[categoryType]) {
			by_type[categoryType].count++;
			by_type[categoryType].budget += cat.budget_amount || 0;
		}
	});

	return {
		total_budget,
		allocated_amount: total_budget, // For now, same as total_budget
		category_count,
		by_type
	};
}

export async function initializeDefaultCategories(): Promise<void> {
	// Check if categories already exist
	const { data: existingCategories, error: checkError } = await supabase
		.from('categories')
		.select('id')
		.limit(1);

	if (checkError) {
		throw new Error(`Failed to check existing categories: ${checkError.message}`);
	}

	// If categories already exist, don't initialize
	if (existingCategories && existingCategories.length > 0) {
		return;
	}

	// Insert default categories
	const categoriesToInsert = [];

	for (const [type, categories] of Object.entries(defaultCategories)) {
		for (const category of categories) {
			categoriesToInsert.push({
				name: category.name,
				type: type as CategoryType,
				description: category.description,
				budget_amount: 0,
				is_active: true
			});
		}
	}

	const { error } = await supabase.from('categories').insert(categoriesToInsert);

	if (error) {
		throw new Error(`Failed to initialize default categories: ${error.message}`);
	}
}

// Category validation
export function validateCategoryData(data: CategoryFormData): string[] {
	const errors: string[] = [];

	if (!data.name || data.name.trim().length === 0) {
		errors.push('Category name is required');
	}

	if (data.name && data.name.trim().length > 100) {
		errors.push('Category name must be less than 100 characters');
	}

	if (!data.type) {
		errors.push('Category type is required');
	}

	if (data.budget_amount && isNaN(parseFloat(data.budget_amount))) {
		errors.push('Budget amount must be a valid number');
	}

	if (data.budget_amount && parseFloat(data.budget_amount) < 0) {
		errors.push('Budget amount cannot be negative');
	}

	return errors;
}

// Get categories by type
export async function getCategoriesByType(type: CategoryType): Promise<Category[]> {
	const { data, error } = await supabase
		.from('categories')
		.select('*')
		.eq('type', type)
		.eq('is_active', true)
		.order('name', { ascending: true });

	if (error) {
		throw new Error(`Failed to fetch categories by type: ${error.message}`);
	}

	return data || [];
}

// Search categories
export async function searchCategories(query: string): Promise<Category[]> {
	const { data, error } = await supabase
		.from('categories')
		.select('*')
		.eq('is_active', true)
		.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
		.order('name', { ascending: true });

	if (error) {
		throw new Error(`Failed to search categories: ${error.message}`);
	}

	return data || [];
}

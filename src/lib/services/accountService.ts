import { supabase } from '$lib/supabaseClient';
import type { Account, NewAccount, UpdateAccount, AccountFormData } from '$lib/types';

// Create a new account
export async function createAccount(data: AccountFormData): Promise<Account> {
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

	const newAccount: NewAccount = {
		family_id: user.family_id,
		name: data.name.trim(),
		type: data.type,
		balance: data.balance ? parseFloat(data.balance) : 0,
		is_active: true
	};

	const { data: account, error } = await supabase
		.from('accounts')
		.insert(newAccount)
		.select()
		.single();

	if (error) {
		console.error('Error creating account:', error);
		throw new Error('Failed to create account');
	}

	return account;
}

// Get all accounts for user's family (including archived)
export async function getAccounts(): Promise<Account[]> {
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
		console.warn('User family not found, returning empty accounts');
		return [];
	}

	const { data: accounts, error } = await supabase
		.from('accounts')
		.select('*')
		.eq('family_id', user.family_id)
		.order('created_at', { ascending: true });

	if (error) {
		console.error('Error fetching accounts:', error);
		throw new Error('Failed to fetch accounts');
	}

	return accounts || [];
}

// Get only active accounts for user's family
export async function getActiveAccounts(): Promise<Account[]> {
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
		console.warn('User family not found, returning empty accounts');
		return [];
	}

	const { data: accounts, error } = await supabase
		.from('accounts')
		.select('*')
		.eq('family_id', user.family_id)
		.eq('is_active', true)
		.order('created_at', { ascending: true });

	if (error) {
		console.error('Error fetching active accounts:', error);
		throw new Error('Failed to fetch active accounts');
	}

	return accounts || [];
}

// Get account by ID
export async function getAccount(id: string): Promise<Account | null> {
	const { data: account, error } = await supabase
		.from('accounts')
		.select('*')
		.eq('id', id)
		.single();

	if (error) {
		console.error('Error fetching account:', error);
		return null;
	}

	return account;
}

// Update account
export async function updateAccount(id: string, data: Partial<AccountFormData>): Promise<Account> {
	const updateData: UpdateAccount = {};

	if (data.name !== undefined) {
		updateData.name = data.name.trim();
	}
	if (data.type !== undefined) {
		updateData.type = data.type;
	}
	if (data.balance !== undefined) {
		updateData.balance = parseFloat(data.balance);
	}

	const { data: account, error } = await supabase
		.from('accounts')
		.update(updateData)
		.eq('id', id)
		.select()
		.single();

	if (error) {
		console.error('Error updating account:', error);
		throw new Error('Failed to update account');
	}

	return account;
}

// Hard delete account (completely remove)
export async function deleteAccount(id: string): Promise<void> {
	// Check if account has transactions
	const { count } = await supabase
		.from('transactions')
		.select('*', { count: 'exact', head: true })
		.eq('account_id', id);

	if (count && count > 0) {
		throw new Error('Cannot delete account with existing transactions. Archive it instead.');
	}

	// Permanently delete the account
	const { error } = await supabase.from('accounts').delete().eq('id', id);

	if (error) {
		console.error('Error deleting account:', error);
		throw new Error('Failed to delete account');
	}
}

// Archive account (mark as inactive but keep accessible)
export async function archiveAccount(id: string): Promise<Account> {
	const { data: account, error } = await supabase
		.from('accounts')
		.update({ is_active: false })
		.eq('id', id)
		.select()
		.single();

	if (error) {
		console.error('Error archiving account:', error);
		throw new Error('Failed to archive account');
	}

	return account;
}

// Reactivate account
export async function reactivateAccount(id: string): Promise<Account> {
	const { data: account, error } = await supabase
		.from('accounts')
		.update({ is_active: true })
		.eq('id', id)
		.select()
		.single();

	if (error) {
		console.error('Error reactivating account:', error);
		throw new Error('Failed to reactivate account');
	}

	return account;
}

// Get account balance summary
export async function getAccountSummary(): Promise<{
	total_assets: number;
	total_liabilities: number;
	net_worth: number;
	account_count: number;
}> {
	const accounts = await getActiveAccounts(); // Only use active accounts for summary

	let totalAssets = 0;
	let totalLiabilities = 0;

	accounts.forEach((account) => {
		if (['checking', 'savings', 'cash', 'investment'].includes(account.type)) {
			totalAssets += account.balance;
		} else if (['credit_card', 'loan'].includes(account.type)) {
			totalLiabilities += Math.abs(account.balance);
		}
	});

	return {
		total_assets: totalAssets,
		total_liabilities: totalLiabilities,
		net_worth: totalAssets - totalLiabilities,
		account_count: accounts.length
	};
}

// Get accounts grouped by type
export async function getAccountsByType(): Promise<Record<string, Account[]>> {
	const accounts = await getAccounts();

	return accounts.reduce(
		(groups, account) => {
			const type = account.type;
			if (!groups[type]) {
				groups[type] = [];
			}
			groups[type].push(account);
			return groups;
		},
		{} as Record<string, Account[]>
	);
}

// Account type display helpers
export const accountTypeLabels: Record<string, string> = {
	checking: 'Checking Account',
	savings: 'Savings Account',
	credit_card: 'Credit Card',
	cash: 'Cash',
	investment: 'Investment Account',
	loan: 'Loan Account'
};

export const accountTypeIcons: Record<string, string> = {
	checking: '🏦',
	savings: '💰',
	credit_card: '💳',
	cash: '💵',
	investment: '📈',
	loan: '🏠'
};

export const accountTypeColors: Record<string, string> = {
	checking: 'blue',
	savings: 'green',
	credit_card: 'red',
	cash: 'yellow',
	investment: 'purple',
	loan: 'orange'
};

// Validation helpers
export function validateAccountData(data: AccountFormData): string[] {
	const errors: string[] = [];

	if (!data.name.trim()) {
		errors.push('Account name is required');
	} else if (data.name.trim().length < 2) {
		errors.push('Account name must be at least 2 characters');
	} else if (data.name.trim().length > 50) {
		errors.push('Account name must be less than 50 characters');
	}

	if (!data.type) {
		errors.push('Account type is required');
	}

	if (data.balance && isNaN(parseFloat(data.balance))) {
		errors.push('Balance must be a valid number');
	}

	return errors;
}

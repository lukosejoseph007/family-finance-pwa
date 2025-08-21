import { supabase } from '$lib/supabaseClient';
import type { Transaction, TransactionFormData } from '$lib/types';

// Helper function to get authenticated user and family info
async function getUserContext(): Promise<{ userId: string; familyId: string }> {
	const { data: authUser, error: authError } = await supabase.auth.getUser();
	if (authError || !authUser.user) {
		throw new Error('User not authenticated');
	}

	const { data: user, error: userError } = await supabase
		.from('users')
		.select('family_id')
		.eq('id', authUser.user.id)
		.single();

	if (userError || !user?.family_id) {
		throw new Error('User is not part of a family');
	}

	return { userId: authUser.user.id, familyId: user.family_id };
}

// Helper function to update account balance
async function updateAccountBalance(accountId: string, amountChange: number): Promise<void> {
	const { error } = await supabase.rpc('update_account_balance', {
		account_id: accountId,
		amount_change: amountChange
	});

	if (error) {
		// Fallback to manual update
		const { data: account, error: fetchError } = await supabase
			.from('accounts')
			.select('balance')
			.eq('id', accountId)
			.single();

		if (fetchError) throw new Error(`Failed to fetch account: ${fetchError.message}`);
		
		const { error: updateError } = await supabase
			.from('accounts')
			.update({ balance: account.balance + amountChange })
			.eq('id', accountId);

		if (updateError) throw new Error(`Failed to update balance: ${updateError.message}`);
	}
}

// Base query with relations
const baseQuery = () => supabase
	.from('transactions')
	.select(`
		*,
		account:accounts(name, type),
		category:categories(name, type)
	`);

export async function getTransactions(options: {
	limit?: number;
	offset?: number;
	account_id?: string;
	category_id?: string;
	date_from?: string;
	date_to?: string;
	search?: string;
	is_cleared?: boolean;
} = {}): Promise<{ transactions: Transaction[]; total_count: number }> {
	let query = supabase
		.from('transactions')
		.select(`
			*,
			account:accounts(name, type),
			category:categories(name, type)
		`, { count: 'exact' })
		.order('transaction_date', { ascending: false })
		.order('created_at', { ascending: false });

	// Apply filters
	if (options.account_id) query = query.eq('account_id', options.account_id);
	if (options.category_id) query = query.eq('category_id', options.category_id);
	if (options.is_cleared !== undefined) query = query.eq('is_cleared', options.is_cleared);
	if (options.date_from) query = query.gte('transaction_date', options.date_from);
	if (options.date_to) query = query.lte('transaction_date', options.date_to);
	if (options.search) query = query.or(`description.ilike.%${options.search}%,memo.ilike.%${options.search}%`);
	if (options.limit) query = query.limit(options.limit);
	if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 50) - 1);

	const { data, error, count } = await query;
	if (error) throw new Error(`Failed to fetch transactions: ${error.message}`);

	return { transactions: data || [], total_count: count || 0 };
}

export async function getTransactionById(id: string): Promise<Transaction> {
	const { data, error } = await baseQuery().eq('id', id).single();
	if (error) throw new Error(`Failed to fetch transaction: ${error.message}`);
	return data;
}

export async function createTransaction(transactionData: TransactionFormData): Promise<Transaction> {
	const { userId, familyId } = await getUserContext();
	const amount = parseFloat(transactionData.amount);
	
	const { data: transaction, error } = await supabase
		.from('transactions')
		.insert([{
			family_id: familyId,
			user_id: userId,
			account_id: transactionData.account_id,
			category_id: transactionData.category_id || null,
			amount,
			transaction_date: transactionData.transaction_date,
			description: transactionData.description,
			memo: transactionData.memo || null,
			is_cleared: transactionData.is_cleared || false
		}])
		.select(`
			*,
			account:accounts(name, type),
			category:categories(name, type)
		`)
		.single();

	if (error) throw new Error(`Failed to create transaction: ${error.message}`);
	
	await updateAccountBalance(transactionData.account_id, amount);
	return transaction;
}

export async function updateTransaction(id: string, transactionData: TransactionFormData): Promise<Transaction> {
	const originalTransaction = await getTransactionById(id);
	const { userId, familyId } = await getUserContext();
	const newAmount = parseFloat(transactionData.amount);
	
	const { data, error } = await supabase
		.from('transactions')
		.update({
			family_id: familyId,
			user_id: userId,
			account_id: transactionData.account_id,
			category_id: transactionData.category_id || null,
			amount: newAmount,
			transaction_date: transactionData.transaction_date,
			description: transactionData.description,
			memo: transactionData.memo || null,
			is_cleared: transactionData.is_cleared || false
		})
		.eq('id', id)
		.select(`
			*,
			account:accounts(name, type),
			category:categories(name, type)
		`)
		.single();

	if (error) throw new Error(`Failed to update transaction: ${error.message}`);

	// Handle balance updates
	const balanceDifference = newAmount - originalTransaction.amount;
	if (originalTransaction.account_id === transactionData.account_id) {
		if (balanceDifference !== 0) {
			await updateAccountBalance(transactionData.account_id, balanceDifference);
		}
	} else {
		await updateAccountBalance(originalTransaction.account_id, -originalTransaction.amount);
		await updateAccountBalance(transactionData.account_id, newAmount);
	}

	return data;
}

export async function deleteTransaction(id: string): Promise<void> {
	const transaction = await getTransactionById(id);
	
	const { error } = await supabase.from('transactions').delete().eq('id', id);
	if (error) throw new Error(`Failed to delete transaction: ${error.message}`);

	await updateAccountBalance(transaction.account_id, -transaction.amount);
}

export async function toggleTransactionCleared(id: string): Promise<Transaction> {
	const transaction = await getTransactionById(id);
	
	const { data, error } = await supabase
		.from('transactions')
		.update({ is_cleared: !transaction.is_cleared })
		.eq('id', id)
		.select(`
			*,
			account:accounts(name, type),
			category:categories(name, type)
		`)
		.single();

	if (error) throw new Error(`Failed to toggle transaction status: ${error.message}`);
	return data;
}

export function validateTransactionData(data: TransactionFormData): string[] {
	const errors: string[] = [];
	const amount = parseFloat(data.amount);

	if (!data.account_id) errors.push('Account is required');
	if (!data.amount?.toString().trim()) errors.push('Amount is required');
	if (isNaN(amount)) errors.push('Amount must be a valid number');
	if (amount === 0) errors.push('Amount cannot be zero');
	if (!data.transaction_date) errors.push('Transaction date is required');
	if (!data.description?.trim()) errors.push('Description is required');
	if (data.description?.trim().length > 200) errors.push('Description must be less than 200 characters');
	if (data.memo && data.memo.length > 500) errors.push('Memo must be less than 500 characters');

	return errors;
}

export async function getTransactionSummary(options: {
	account_id?: string;
	category_id?: string;
	date_from?: string;
	date_to?: string;
} = {}): Promise<{
	total_income: number;
	total_expenses: number;
	net_amount: number;
	transaction_count: number;
	uncleared_count: number;
}> {
	let query = supabase.from('transactions').select('amount, is_cleared');

	if (options.account_id) query = query.eq('account_id', options.account_id);
	if (options.category_id) query = query.eq('category_id', options.category_id);
	if (options.date_from) query = query.gte('transaction_date', options.date_from);
	if (options.date_to) query = query.lte('transaction_date', options.date_to);

	const { data, error } = await query;
	if (error) throw new Error(`Failed to fetch summary: ${error.message}`);

	const transactions = data || [];
	
	return {
		total_income: transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
		total_expenses: Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)),
		net_amount: transactions.reduce((sum, t) => sum + t.amount, 0),
		transaction_count: transactions.length,
		uncleared_count: transactions.filter(t => !t.is_cleared).length
	};
}

export async function getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
	const { data, error } = await baseQuery()
		.order('created_at', { ascending: false })
		.limit(limit);

	if (error) throw new Error(`Failed to fetch recent transactions: ${error.message}`);
	return data || [];
}

export async function searchTransactions(query: string, limit: number = 20): Promise<Transaction[]> {
	const { data, error } = await baseQuery()
		.or(`description.ilike.%${query}%,memo.ilike.%${query}%`)
		.order('transaction_date', { ascending: false })
		.limit(limit);

	if (error) throw new Error(`Failed to search transactions: ${error.message}`);
	return data || [];
}

export async function bulkUpdateTransactions(
	transactionIds: string[], 
	updates: Partial<Pick<Transaction, 'category_id' | 'is_cleared'>>
): Promise<void> {
	const { error } = await supabase
		.from('transactions')
		.update(updates)
		.in('id', transactionIds);

	if (error) throw new Error(`Failed to bulk update: ${error.message}`);
}

export async function exportTransactions(options: {
	date_from?: string;
	date_to?: string;
	account_id?: string;
	category_id?: string;
} = {}): Promise<Transaction[]> {
	const { transactions } = await getTransactions({ ...options, limit: undefined });
	return transactions;
}
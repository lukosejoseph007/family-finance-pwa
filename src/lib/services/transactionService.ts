import { supabase } from '$lib/supabaseClient';
import type { Transaction, TransactionFormData } from '$lib/types';

// Transaction management functions
export async function getTransactions(options?: {
	limit?: number;
	offset?: number;
	account_id?: string;
	category_id?: string;
	date_from?: string;
	date_to?: string;
	search?: string;
	is_cleared?: boolean;
}): Promise<{ transactions: Transaction[]; total_count: number }> {
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
	if (options?.account_id) {
		query = query.eq('account_id', options.account_id);
	}

	if (options?.category_id) {
		query = query.eq('category_id', options.category_id);
	}

	if (options?.is_cleared !== undefined) {
		query = query.eq('is_cleared', options.is_cleared);
	}

	if (options?.date_from) {
		query = query.gte('transaction_date', options.date_from);
	}

	if (options?.date_to) {
		query = query.lte('transaction_date', options.date_to);
	}

	if (options?.search) {
		query = query.or(`description.ilike.%${options.search}%,memo.ilike.%${options.search}%`);
	}

	// Apply pagination
	if (options?.limit) {
		query = query.limit(options.limit);
	}

	if (options?.offset) {
		query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
	}

	const { data, error, count } = await query;

	if (error) {
		throw new Error(`Failed to fetch transactions: ${error.message}`);
	}

	return {
		transactions: data || [],
		total_count: count || 0
	};
}

export async function getTransactionById(id: string): Promise<Transaction> {
	const { data, error } = await supabase
		.from('transactions')
		.select(`
			*,
			account:accounts(name, type),
			category:categories(name, type)
		`)
		.eq('id', id)
		.single();

	if (error) {
		throw new Error(`Failed to fetch transaction: ${error.message}`);
	}

	return data;
}

export async function createTransaction(transactionData: TransactionFormData): Promise<Transaction> {
	console.log('Creating transaction', transactionData);
	const amount = parseFloat(transactionData.amount);
	console.log('Parsed amount', amount);
	
	// Start a transaction to update both transaction and account balance
	const { data: transaction, error: transactionError } = await supabase
		.from('transactions')
		.insert([{
			account_id: transactionData.account_id,
			category_id: transactionData.category_id || null,
			amount: amount,
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

	if (transactionError) {
		console.error('Failed to create transaction', transactionError);
		throw new Error(`Failed to create transaction: ${transactionError.message}`);
	}
	
	console.log('Transaction created successfully', transaction);

	// Update account balance
	console.log('Updating account balance for account', transactionData.account_id, 'with amount', amount);
	await updateAccountBalance(transactionData.account_id, amount);

	return transaction;
}

export async function updateTransaction(id: string, transactionData: TransactionFormData): Promise<Transaction> {
	// Get the original transaction to calculate balance difference
	const originalTransaction = await getTransactionById(id);
	const newAmount = parseFloat(transactionData.amount);
	const balanceDifference = newAmount - originalTransaction.amount;
	
	const { data, error } = await supabase
		.from('transactions')
		.update({
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

	if (error) {
		throw new Error(`Failed to update transaction: ${error.message}`);
	}

	// Update account balance if amount changed or account changed
	if (originalTransaction.account_id === transactionData.account_id) {
		// Same account, just update the difference
		if (balanceDifference !== 0) {
			await updateAccountBalance(transactionData.account_id, balanceDifference);
		}
	} else {
		// Account changed, reverse original and add new
		await updateAccountBalance(originalTransaction.account_id, -originalTransaction.amount);
		await updateAccountBalance(transactionData.account_id, newAmount);
	}

	return data;
}

export async function deleteTransaction(id: string): Promise<void> {
	// Get the transaction to reverse the balance change
	const transaction = await getTransactionById(id);
	
	const { error } = await supabase
		.from('transactions')
		.delete()
		.eq('id', id);

	if (error) {
		throw new Error(`Failed to delete transaction: ${error.message}`);
	}

	// Reverse the account balance change
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

	if (error) {
		throw new Error(`Failed to toggle transaction cleared status: ${error.message}`);
	}

	return data;
}

// Helper function to update account balance
async function updateAccountBalance(accountId: string, amountChange: number): Promise<void> {
	console.log('Updating account balance', { accountId, amountChange });
	
	const { error } = await supabase.rpc('update_account_balance', {
		account_id: accountId,
		amount_change: amountChange
	});

	if (error) {
		console.error('Failed to update account balance via RPC', error);
		// Fallback to manual balance update if RPC not available
		const { data: account, error: fetchError } = await supabase
			.from('accounts')
			.select('balance')
			.eq('id', accountId)
			.single();

		
		if (fetchError) {
			console.error('Failed to fetch account balance', fetchError);
			throw new Error(`Failed to fetch account balance: ${fetchError.message}`);
		}
		
		console.log('Current account balance', account.balance);
		const newBalance = account.balance + amountChange;
		console.log('New account balance', newBalance);

		const { error: updateError } = await supabase
			.from('accounts')
			.update({ balance: newBalance })
			.eq('id', accountId);

		if (updateError) {
			console.error('Failed to update account balance manually', updateError);
			throw new Error(`Failed to update account balance: ${updateError.message}`);
		}
	}
}

// Transaction validation
export function validateTransactionData(data: TransactionFormData): string[] {
	const errors: string[] = [];

	if (!data.account_id) {
		errors.push('Account is required');
	}

	if (!data.amount || String(data.amount).trim().length === 0) {
		errors.push('Amount is required');
	}

	if (data.amount && isNaN(parseFloat(data.amount))) {
		errors.push('Amount must be a valid number');
	}

	if (data.amount && parseFloat(data.amount) === 0) {
		errors.push('Amount cannot be zero');
	}

	if (!data.transaction_date) {
		errors.push('Transaction date is required');
	}

	if (!data.description || data.description.trim().length === 0) {
		errors.push('Description is required');
	}

	if (data.description && data.description.trim().length > 200) {
		errors.push('Description must be less than 200 characters');
	}

	if (data.memo && data.memo.length > 500) {
		errors.push('Memo must be less than 500 characters');
	}

	return errors;
}

// Get transaction summary for dashboard
export async function getTransactionSummary(options?: {
	account_id?: string;
	category_id?: string;
	date_from?: string;
	date_to?: string;
}): Promise<{
	total_income: number;
	total_expenses: number;
	net_amount: number;
	transaction_count: number;
	uncleared_count: number;
}> {
	let query = supabase
		.from('transactions')
		.select('amount, is_cleared');

	// Apply filters
	if (options?.account_id) {
		query = query.eq('account_id', options.account_id);
	}

	if (options?.category_id) {
		query = query.eq('category_id', options.category_id);
	}

	if (options?.date_from) {
		query = query.gte('transaction_date', options.date_from);
	}

	if (options?.date_to) {
		query = query.lte('transaction_date', options.date_to);
	}

	const { data, error } = await query;

	if (error) {
		throw new Error(`Failed to fetch transaction summary: ${error.message}`);
	}

	const transactions = data || [];
	
	const total_income = transactions
		.filter(t => t.amount > 0)
		.reduce((sum, t) => sum + t.amount, 0);
	
	const total_expenses = Math.abs(
		transactions
			.filter(t => t.amount < 0)
			.reduce((sum, t) => sum + t.amount, 0)
	);
	
	const net_amount = transactions.reduce((sum, t) => sum + t.amount, 0);
	const transaction_count = transactions.length;
	const uncleared_count = transactions.filter(t => !t.is_cleared).length;

	return {
		total_income,
		total_expenses,
		net_amount,
		transaction_count,
		uncleared_count
	};
}

// Get recent transactions for dashboard
export async function getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
	const { data, error } = await supabase
		.from('transactions')
		.select(`
			*,
			account:accounts(name, type),
			category:categories(name, type)
		`)
		.order('created_at', { ascending: false })
		.limit(limit);

	if (error) {
		throw new Error(`Failed to fetch recent transactions: ${error.message}`);
	}

	return data || [];
}

// Search transactions
export async function searchTransactions(query: string, limit: number = 20): Promise<Transaction[]> {
	const { data, error } = await supabase
		.from('transactions')
		.select(`
			*,
			account:accounts(name, type),
			category:categories(name, type)
		`)
		.or(`description.ilike.%${query}%,memo.ilike.%${query}%`)
		.order('transaction_date', { ascending: false })
		.limit(limit);

	if (error) {
		throw new Error(`Failed to search transactions: ${error.message}`);
	}

	return data || [];
}

// Bulk operations
export async function bulkUpdateTransactions(
	transactionIds: string[], 
	updates: Partial<Pick<Transaction, 'category_id' | 'is_cleared'>>
): Promise<void> {
	const { error } = await supabase
		.from('transactions')
		.update(updates)
		.in('id', transactionIds);

	if (error) {
		throw new Error(`Failed to bulk update transactions: ${error.message}`);
	}
}

// Export transactions for analysis
export async function exportTransactions(options?: {
	date_from?: string;
	date_to?: string;
	account_id?: string;
	category_id?: string;
}): Promise<Transaction[]> {
	let query = supabase
		.from('transactions')
		.select(`
			*,
			account:accounts(name, type),
			category:categories(name, type)
		`)
		.order('transaction_date', { ascending: false });

	// Apply filters
	if (options?.account_id) {
		query = query.eq('account_id', options.account_id);
	}

	if (options?.category_id) {
		query = query.eq('category_id', options.category_id);
	}

	if (options?.date_from) {
		query = query.gte('transaction_date', options.date_from);
	}

	if (options?.date_to) {
		query = query.lte('transaction_date', options.date_to);
	}

	const { data, error } = await query;

	if (error) {
		throw new Error(`Failed to export transactions: ${error.message}`);
	}

	return data || [];
}
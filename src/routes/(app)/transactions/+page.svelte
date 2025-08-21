<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Input, Card, Modal } from '$lib/components';
	import { formatCurrency } from '$lib/components/charts/ChartUtils';
	import {
		getTransactions,
		getTransactionSummary,
		createTransaction,
		updateTransaction,
		deleteTransaction,
		toggleTransactionCleared,
		validateTransactionData
	} from '$lib/services/transactionService';
	import { getAccounts } from '$lib/services/accountService';
	import { getCategories } from '$lib/services/categoryService';
	import type { Transaction, TransactionFormData, Account, Category } from '$lib/types';

	let transactions: Transaction[] = $state([]);
	let accounts: Account[] = $state([]);
	let categories: Category[] = $state([]);
	let summary = $state({
		total_income: 0,
		total_expenses: 0,
		net_amount: 0,
		transaction_count: 0,
		uncleared_count: 0
	});

	let loading = $state(true);
	let error = $state('');
	let success = $state('');

	// Pagination and filtering
	let currentPage = $state(1);
	let pageSize = $state(25);
	let totalCount = $state(0);
	let searchQuery = $state('');
	let selectedAccount = $state('');
	let selectedCategory = $state('');
	let dateFrom = $state('');
	let dateTo = $state('');
	let showClearedOnly = $state(false);

	// Modal states
	let addModalOpen = $state(false);
	let editModalOpen = $state(false);
	let deleteModalOpen = $state(false);
	let selectedTransaction: Transaction | null = $state(null);

	// Form states
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

	onMount(() => {
		// Load data asynchronously
		loadData();

		// Listen for FAB click events
		const handleFabClick = (event: CustomEvent) => {
			if (event.detail.page === '/transactions') {
				openAddModal();
			}
		};

		window.addEventListener('fab-click', handleFabClick as EventListener);

		// Return cleanup function
		return () => {
			window.removeEventListener('fab-click', handleFabClick as EventListener);
		};
	});

	async function loadData() {
		try {
			loading = true;
			const [transactionData, accountsData, categoriesData, summaryData] = await Promise.all([
				getTransactions({
					limit: pageSize,
					offset: (currentPage - 1) * pageSize,
					account_id: selectedAccount || undefined,
					category_id: selectedCategory || undefined,
					date_from: dateFrom || undefined,
					date_to: dateTo || undefined,
					search: searchQuery || undefined,
					is_cleared: showClearedOnly ? true : undefined
				}),
				getAccounts(),
				getCategories(),
				getTransactionSummary({
					account_id: selectedAccount || undefined,
					category_id: selectedCategory || undefined,
					date_from: dateFrom || undefined,
					date_to: dateTo || undefined
				})
			]);

			transactions = transactionData.transactions;
			totalCount = transactionData.total_count;
			accounts = accountsData.filter((acc) => acc.is_active);
			categories = categoriesData.filter((cat) => cat.is_active);
			summary = summaryData;
		} catch (err: any) {
			error = err.message || 'Failed to load transactions';
		} finally {
			loading = false;
		}
	}

	function openAddModal() {
		formData = {
			account_id: selectedAccount || (accounts.length > 0 ? accounts[0].id : ''),
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

	function openEditModal(transaction: Transaction) {
		selectedTransaction = transaction;
		formData = {
			account_id: transaction.account_id,
			category_id: transaction.category_id,
			amount: Math.abs(transaction.amount).toString(),
			transaction_date: transaction.transaction_date,
			description: transaction.description,
			memo: transaction.memo || '',
			is_cleared: transaction.is_cleared
		};
		formErrors = [];
		editModalOpen = true;
	}

	function openDeleteModal(transaction: Transaction) {
		selectedTransaction = transaction;
		deleteModalOpen = true;
	}

	async function handleSave() {
		formErrors = validateTransactionData(formData);
		if (formErrors.length > 0) return;

		try {
			saving = true;
			error = '';

			// Convert amount to negative for expenses (positive for income)
			const isIncome = selectedCategory
				? categories.find((c) => c.id === formData.category_id)?.type === 'income'
				: false;
			const amount = isIncome
				? Math.abs(parseFloat(formData.amount))
				: -Math.abs(parseFloat(formData.amount));

			const transactionData = {
				...formData,
				amount: amount.toString()
			};

			if (editModalOpen && selectedTransaction) {
				await updateTransaction(selectedTransaction.id, transactionData);
				editModalOpen = false;
				success = 'Transaction updated successfully';
			} else {
				await createTransaction(transactionData);
				addModalOpen = false;
				success = 'Transaction added successfully';
			}

			await loadData();
			setTimeout(() => (success = ''), 3000);
		} catch (err: any) {
			error = err.message || 'Failed to save transaction';
		} finally {
			saving = false;
		}
	}

	async function handleDelete() {
		if (!selectedTransaction) return;

		try {
			await deleteTransaction(selectedTransaction.id);
			deleteModalOpen = false;
			await loadData();
			success = 'Transaction deleted successfully';
			setTimeout(() => (success = ''), 3000);
		} catch (err: any) {
			error = err.message || 'Failed to delete transaction';
		}
	}

	async function handleToggleCleared(transaction: Transaction) {
		try {
			await toggleTransactionCleared(transaction.id);
			await loadData();
			success = `Transaction marked as ${transaction.is_cleared ? 'pending' : 'cleared'}`;
			setTimeout(() => (success = ''), 3000);
		} catch (err: any) {
			error = err.message || 'Failed to update transaction';
		}
	}

	async function handleFilterChange() {
		currentPage = 1;
		await loadData();
	}

	async function handlePageChange(page: number) {
		currentPage = page;
		await loadData();
	}

	function getTransactionIcon(transaction: Transaction) {
		if (transaction.amount > 0) return '💰';

		const account = accounts.find((a) => a.id === transaction.account_id);
		if (account?.type === 'credit_card') return '💳';
		if (account?.type === 'cash') return '💵';
		return '💸';
	}

	function getTransactionColor(transaction: Transaction) {
		if (transaction.amount > 0) return 'text-green-600';
		return 'text-red-600';
	}

	function formatTransactionAmount(amount: number) {
		return amount > 0 ? `+${formatCurrency(amount)}` : formatCurrency(amount);
	}

	const totalPages = $derived(() => Math.ceil(totalCount / pageSize));
	const hasNextPage = $derived(() => currentPage < totalPages());
	const hasPrevPage = $derived(() => currentPage > 1);

	// Clear filters
	function clearFilters() {
		searchQuery = '';
		selectedAccount = '';
		selectedCategory = '';
		dateFrom = '';
		dateTo = '';
		showClearedOnly = false;
		currentPage = 1;
		loadData();
	}
</script>

<svelte:head>
	<title>Transactions - Family Finance</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50">
	<!-- Professional Header Section -->
	<div class="relative overflow-hidden">
		<!-- Background Pattern -->
		<div class="absolute inset-0 bg-gradient-to-r from-orange-600 via-red-600 to-pink-700"></div>
		<div class="absolute inset-0 bg-black/10"></div>
		<div
			class="absolute inset-0"
			style="background-image: radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)"
		></div>

		<div class="relative px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
			<div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex-1">
					<div class="mb-4 flex items-center space-x-3">
						<div class="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
							<svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
								/>
							</svg>
						</div>
						<div>
							<h1 class="text-3xl font-bold text-white sm:text-4xl">Transactions</h1>
							<p class="mt-1 text-base text-orange-100 opacity-90 sm:text-lg">
								Track your family's income and expenses
							</p>
						</div>
					</div>
				</div>

				<div class="flex-shrink-0">
					<button
						onclick={openAddModal}
						class="group transform rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white/20 hover:shadow-xl"
					>
						<span class="inline-flex items-center">
							<svg
								class="mr-2 h-5 w-5 transition-transform duration-200 group-hover:rotate-90"
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
							Add Transaction
						</span>
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Content Section -->
	<div class="relative">
		<div class="space-y-6 px-4 py-8 pb-12 sm:px-6 lg:px-8">
			{#if loading}
				<div class="py-12 text-center">
					<div class="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
					<p class="mt-2 text-gray-600">Loading transactions...</p>
				</div>
			{:else}
				<!-- Success/Error Messages -->
				{#if success}
					<div class="rounded-md bg-green-50 p-4">
						<div class="text-sm text-green-700">{success}</div>
					</div>
				{/if}

				{#if error}
					<div class="rounded-md bg-red-50 p-4">
						<div class="text-sm text-red-700">{error}</div>
					</div>
				{/if}

				<!-- Summary Cards -->
				<div class="grid grid-cols-1 gap-6 md:grid-cols-4">
					<Card class="text-center">
						<div class="text-2xl font-bold text-green-600">
							{formatCurrency(summary.total_income)}
						</div>
						<p class="mt-1 text-sm text-gray-600">Total Income</p>
					</Card>

					<Card class="text-center">
						<div class="text-2xl font-bold text-red-600">
							{formatCurrency(summary.total_expenses)}
						</div>
						<p class="mt-1 text-sm text-gray-600">Total Expenses</p>
					</Card>

					<Card class="text-center">
						<div
							class="text-2xl font-bold {summary.net_amount >= 0
								? 'text-green-600'
								: 'text-red-600'}"
						>
							{formatCurrency(summary.net_amount)}
						</div>
						<p class="mt-1 text-sm text-gray-600">Net Amount</p>
					</Card>

					<Card class="text-center">
						<div class="text-2xl font-bold text-gray-900">{summary.transaction_count}</div>
						<p class="mt-1 text-sm text-gray-600">
							{summary.uncleared_count > 0 ? `${summary.uncleared_count} Pending` : 'All Cleared'}
						</p>
					</Card>
				</div>

				<!-- Filters -->
				<Card class="p-6">
					<div class="grid grid-cols-1 gap-4 md:grid-cols-6">
						<div class="md:col-span-2">
							<Input
								label="Search"
								bind:value={searchQuery}
								placeholder="Search transactions..."
								on:input={handleFilterChange}
							/>
						</div>

						<div>
							<label for="account-filter" class="mb-1 block text-sm font-medium text-gray-700"
								>Account</label
							>
							<select
								id="account-filter"
								bind:value={selectedAccount}
								onchange={handleFilterChange}
								class="block w-full rounded-lg border-gray-300 px-3 py-2 text-sm"
							>
								<option value="">All Accounts</option>
								{#each accounts as account}
									<option value={account.id}>{account.name}</option>
								{/each}
							</select>
						</div>

						<div>
							<label for="category-filter" class="mb-1 block text-sm font-medium text-gray-700"
								>Category</label
							>
							<select
								id="category-filter"
								bind:value={selectedCategory}
								onchange={handleFilterChange}
								class="block w-full rounded-lg border-gray-300 px-3 py-2 text-sm"
							>
								<option value="">All Categories</option>
								{#each categories as category}
									<option value={category.id}>{category.name}</option>
								{/each}
							</select>
						</div>

						<div>
							<Input
								label="From Date"
								type="date"
								bind:value={dateFrom}
								on:change={handleFilterChange}
							/>
						</div>

						<div>
							<Input
								label="To Date"
								type="date"
								bind:value={dateTo}
								on:change={handleFilterChange}
							/>
						</div>
					</div>

					<div class="mt-4 flex items-center justify-between">
						<div class="flex items-center space-x-4">
							<label class="flex items-center">
								<input
									type="checkbox"
									bind:checked={showClearedOnly}
									onchange={handleFilterChange}
									class="focus:ring-opacity-50 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
								/>
								<span class="ml-2 text-sm text-gray-700">Cleared only</span>
							</label>
						</div>

						<Button variant="outline" on:click={clearFilters}>Clear Filters</Button>
					</div>
				</Card>

				<!-- Transactions List -->
				{#if transactions.length === 0}
					<Card class="py-12 text-center">
						<div
							class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100"
						>
							<span class="text-3xl">💰</span>
						</div>
						<h3 class="mb-2 text-lg font-medium text-gray-900">No transactions found</h3>
						<p class="mb-6 text-gray-600">
							{searchQuery || selectedAccount || selectedCategory
								? 'Try adjusting your filters or search terms.'
								: 'Add your first transaction to start tracking your finances.'}
						</p>
						{#if !searchQuery && !selectedAccount && !selectedCategory}
							<Button on:click={openAddModal}>Add Your First Transaction</Button>
						{/if}
					</Card>
				{:else}
					<Card>
						<div class="divide-y divide-gray-200">
							{#each transactions as transaction (transaction.id)}
								<div class="p-4 hover:bg-gray-50">
									<div class="flex items-center justify-between">
										<div class="flex flex-1 items-start space-x-4">
											<div class="text-2xl">{getTransactionIcon(transaction)}</div>

											<div class="min-w-0 flex-1">
												<div class="flex items-center justify-between">
													<h4 class="truncate font-medium text-gray-900">
														{transaction.description}
													</h4>
													<div class="ml-4 text-right">
														<div class="font-semibold {getTransactionColor(transaction)}">
															{formatTransactionAmount(transaction.amount)}
														</div>
														<div class="text-xs text-gray-500">
															{new Date(transaction.transaction_date).toLocaleDateString('en-IN')}
														</div>
													</div>
												</div>

												<div class="mt-1 flex items-center space-x-4 text-sm text-gray-600">
													<span>
														{accounts.find((a) => a.id === transaction.account_id)?.name ||
															'Unknown Account'}
													</span>
													{#if transaction.category_id}
														<span>•</span>
														<span>
															{categories.find((c) => c.id === transaction.category_id)?.name ||
																'Unknown Category'}
														</span>
													{/if}
													{#if transaction.memo}
														<span>•</span>
														<span class="truncate">{transaction.memo}</span>
													{/if}
												</div>
											</div>
										</div>

										<div class="ml-4 flex items-center space-x-2">
											<!-- Cleared Status -->
											<button
												onclick={() => handleToggleCleared(transaction)}
												class="rounded p-1 {transaction.is_cleared
													? 'text-green-600 hover:text-green-800'
													: 'text-gray-400 hover:text-gray-600'}"
												aria-label={transaction.is_cleared ? 'Mark as pending' : 'Mark as cleared'}
											>
												<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
													<path
														fill-rule="evenodd"
														d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
														clip-rule="evenodd"
													/>
												</svg>
											</button>

											<!-- Edit -->
											<button
												onclick={() => openEditModal(transaction)}
												class="p-1 text-gray-400 hover:text-gray-600"
												aria-label="Edit transaction"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
													/>
												</svg>
											</button>

											<!-- Delete -->
											<button
												onclick={() => openDeleteModal(transaction)}
												class="p-1 text-gray-400 hover:text-red-600"
												aria-label="Delete transaction"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
													/>
												</svg>
											</button>
										</div>
									</div>
								</div>
							{/each}
						</div>

						<!-- Pagination -->
						{#if totalPages() > 1}
							<div class="flex items-center justify-between border-t border-gray-200 px-4 py-3">
								<div class="text-sm text-gray-700">
									Showing {(currentPage - 1) * pageSize + 1} to {Math.min(
										currentPage * pageSize,
										totalCount
									)} of {totalCount} transactions
								</div>
								<div class="flex space-x-2">
									<Button
										variant="outline"
										size="sm"
										disabled={!hasPrevPage}
										on:click={() => handlePageChange(currentPage - 1)}
									>
										Previous
									</Button>
									<Button
										variant="outline"
										size="sm"
										disabled={!hasNextPage}
										on:click={() => handlePageChange(currentPage + 1)}
									>
										Next
									</Button>
								</div>
							</div>
						{/if}
					</Card>
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

<!-- Edit Transaction Modal -->
<Modal bind:open={editModalOpen} title="Edit Transaction">
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
				<label for="edit-account" class="mb-1 block text-sm font-medium text-gray-700"
					>Account *</label
				>
				<select
					id="edit-account"
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
				<label for="edit-category" class="mb-1 block text-sm font-medium text-gray-700"
					>Category</label
				>
				<select
					id="edit-category"
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
		<Button variant="outline" on:click={() => (editModalOpen = false)}>Cancel</Button>
		<Button on:click={handleSave} loading={saving} disabled={saving}>
			{saving ? 'Saving...' : 'Save Changes'}
		</Button>
	</div>
</Modal>

<!-- Delete Transaction Modal -->
<Modal bind:open={deleteModalOpen} title="Delete Transaction">
	<div class="space-y-4">
		<p class="text-gray-600">Are you sure you want to delete this transaction?</p>

		{#if selectedTransaction}
			<div class="rounded-lg bg-gray-50 p-4">
				<div class="flex items-center justify-between">
					<div>
						<h4 class="font-medium text-gray-900">{selectedTransaction.description}</h4>
						<p class="text-sm text-gray-600">
							{formatTransactionAmount(selectedTransaction.amount)} •
							{new Date(selectedTransaction.transaction_date).toLocaleDateString('en-IN')}
						</p>
					</div>
				</div>
			</div>
		{/if}

		<div class="rounded-lg bg-red-50 p-4">
			<p class="text-sm text-red-800">
				This action cannot be undone. The transaction will be permanently removed and account
				balances will be updated accordingly.
			</p>
		</div>
	</div>

	<div slot="footer">
		<Button variant="outline" on:click={() => (deleteModalOpen = false)}>Cancel</Button>
		<Button variant="danger" on:click={handleDelete}>Delete Transaction</Button>
	</div>
</Modal>

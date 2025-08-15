<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Input, Card, Modal } from '$lib/components';
	import { formatCurrency } from '$lib/components/charts/ChartUtils';
	import {
		getAccounts,
		getAccountSummary,
		createAccount,
		updateAccount,
		deleteAccount,
		archiveAccount,
		reactivateAccount,
		accountTypeLabels,
		accountTypeIcons,
		accountTypeColors,
		validateAccountData
	} from '$lib/services/accountService';
	import type { Account, AccountFormData, AccountType } from '$lib/types';

	let accounts: Account[] = $state([]);
	let summary = $state({
		total_assets: 0,
		total_liabilities: 0,
		net_worth: 0,
		account_count: 0
	});
	let loading = $state(true);
	let error = $state('');
	let success = $state('');

	// Modal states
	let addModalOpen = $state(false);
	let editModalOpen = $state(false);
	let archiveModalOpen = $state(false);
	let deleteModalOpen = $state(false);
	let selectedAccount: Account | null = $state(null);

	// Form states
	let formData: AccountFormData = $state({
		name: '',
		type: 'checking',
		balance: ''
	});
	let formErrors: string[] = $state([]);
	let saving = $state(false);

	const accountTypes: { value: AccountType; label: string }[] = [
		{ value: 'checking', label: 'Checking Account' },
		{ value: 'savings', label: 'Savings Account' },
		{ value: 'credit_card', label: 'Credit Card' },
		{ value: 'cash', label: 'Cash' },
		{ value: 'investment', label: 'Investment Account' },
		{ value: 'loan', label: 'Loan Account' }
	];

	onMount(async () => {
		await loadAccounts();
	});

	async function loadAccounts() {
		try {
			loading = true;
			const [accountsData, summaryData] = await Promise.all([
				getAccounts(),
				getAccountSummary()
			]);
			
			accounts = accountsData;
			summary = summaryData;
		} catch (err: any) {
			error = err.message || 'Failed to load accounts';
		} finally {
			loading = false;
		}
	}

	function openAddModal() {
		formData = { name: '', type: 'checking', balance: '' };
		formErrors = [];
		addModalOpen = true;
	}

	function openEditModal(account: Account) {
		selectedAccount = account;
		formData = {
			name: account.name,
			type: account.type,
			balance: account.balance.toString()
		};
		formErrors = [];
		editModalOpen = true;
	}

	function openArchiveModal(account: Account) {
		selectedAccount = account;
		archiveModalOpen = true;
	}

	function openDeleteModal(account: Account) {
		selectedAccount = account;
		deleteModalOpen = true;
	}

	async function handleSave() {
		formErrors = validateAccountData(formData);
		if (formErrors.length > 0) return;

		try {
			saving = true;
			error = '';

			if (editModalOpen && selectedAccount) {
				await updateAccount(selectedAccount.id, formData);
				editModalOpen = false;
				success = 'Account updated successfully';
			} else {
				await createAccount(formData);
				addModalOpen = false;
				success = 'Account created successfully';
			}

			await loadAccounts();
			setTimeout(() => success = '', 3000);
		} catch (err: any) {
			error = err.message || 'Failed to save account';
		} finally {
			saving = false;
		}
	}

	async function handleArchive() {
		if (!selectedAccount) return;

		try {
			await archiveAccount(selectedAccount.id);
			archiveModalOpen = false;
			await loadAccounts();
			success = 'Account archived successfully';
			setTimeout(() => success = '', 3000);
		} catch (err: any) {
			error = err.message || 'Failed to archive account';
		}
	}

	async function handleDelete() {
		if (!selectedAccount) return;

		try {
			await deleteAccount(selectedAccount.id);
			deleteModalOpen = false;
			await loadAccounts();
			success = 'Account deleted successfully';
			setTimeout(() => success = '', 3000);
		} catch (err: any) {
			error = err.message || 'Failed to delete account';
		}
	}

	async function handleReactivate(account: Account) {
		try {
			await reactivateAccount(account.id);
			await loadAccounts();
			success = 'Account reactivated successfully';
			setTimeout(() => success = '', 3000);
		} catch (err: any) {
			error = err.message || 'Failed to reactivate account';
		}
	}

	function getAccountColorClasses(type: AccountType) {
		const color = accountTypeColors[type];
		return {
			bg: `bg-${color}-100`,
			text: `text-${color}-800`,
			border: `border-${color}-200`
		};
	}

	const groupedAccounts = $derived(() => {
		const groups: Record<string, Account[]> = {};
		accounts.forEach(account => {
			if (!groups[account.type]) {
				groups[account.type] = [];
			}
			groups[account.type].push(account);
		});
		return groups;
	});
</script>

<svelte:head>
	<title>Accounts - Family Finance</title>
</svelte:head>

<div class="space-y-8">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Accounts</h1>
			<p class="mt-2 text-gray-600">Manage your family's bank accounts and track balances</p>
		</div>
		<Button on:click={openAddModal}>
			Add Account
		</Button>
	</div>

	{#if loading}
		<div class="text-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
			<p class="mt-2 text-gray-600">Loading accounts...</p>
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
		<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
			<Card class="text-center">
				<div class="text-2xl font-bold text-green-600">{formatCurrency(summary.total_assets)}</div>
				<p class="text-sm text-gray-600 mt-1">Total Assets</p>
			</Card>
			
			<Card class="text-center">
				<div class="text-2xl font-bold text-red-600">{formatCurrency(summary.total_liabilities)}</div>
				<p class="text-sm text-gray-600 mt-1">Total Liabilities</p>
			</Card>
			
			<Card class="text-center">
				<div class="text-2xl font-bold {summary.net_worth >= 0 ? 'text-green-600' : 'text-red-600'}">
					{formatCurrency(summary.net_worth)}
				</div>
				<p class="text-sm text-gray-600 mt-1">Net Worth</p>
			</Card>
			
			<Card class="text-center">
				<div class="text-2xl font-bold text-blue-600">{summary.account_count}</div>
				<p class="text-sm text-gray-600 mt-1">Active Accounts</p>
			</Card>
		</div>

		<!-- Accounts by Type -->
		{#if accounts.length === 0}
			<Card class="text-center py-12">
				<div class="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
					<span class="text-3xl">🏦</span>
				</div>
				<h3 class="text-lg font-medium text-gray-900 mb-2">No accounts yet</h3>
				<p class="text-gray-600 mb-6">
					Add your first account to start tracking your family's finances.
				</p>
				<Button on:click={openAddModal}>Add Your First Account</Button>
			</Card>
		{:else}
			{#each Object.entries(groupedAccounts) as [type, typeAccounts]}
				<Card class="mb-6">
					<div class="flex items-center justify-between mb-6">
						<div class="flex items-center space-x-3">
							<span class="text-2xl">{accountTypeIcons[type]}</span>
							<div>
								<h3 class="text-lg font-semibold text-gray-900">{accountTypeLabels[type]}s</h3>
								<p class="text-sm text-gray-600">
									{typeAccounts.length} accounts
								</p>
							</div>
						</div>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{#each typeAccounts as account (account.id)}
							<div class="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
								<div class="flex items-start justify-between mb-3">
									<div class="flex items-center space-x-3">
										<div class="w-10 h-10 {getAccountColorClasses(account.type).bg} rounded-full flex items-center justify-center">
											<span class="text-lg">{accountTypeIcons[account.type]}</span>
										</div>
										<div>
											<h4 class="font-medium text-gray-900">{account.name}</h4>
											<p class="text-xs text-gray-500">{accountTypeLabels[account.type]}</p>
										</div>
									</div>
									<div class="flex space-x-2">
										<!-- Edit Button -->
										<button
											onclick={() => openEditModal(account)}
											class="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
											aria-label="Edit account"
										>
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
											</svg>
										</button>
										
										{#if account.is_active}
											<!-- Archive Button -->
											<button
												onclick={() => openArchiveModal(account)}
												class="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
												aria-label="Archive account"
											>
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8l4 4 4-4m0 0V4a1 1 0 011-1h4a1 1 0 011 1v4m-6 0h6m-6 0V8" />
												</svg>
											</button>
											
											<!-- Delete Button -->
											<button
												onclick={() => openDeleteModal(account)}
												class="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
												aria-label="Delete account permanently"
											>
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
											</button>
										{:else}
											<!-- Reactivate Button -->
											<button
												onclick={() => handleReactivate(account)}
												class="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
												aria-label="Reactivate account"
											>
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
												</svg>
											</button>
										{/if}
									</div>
								</div>
								
								<div class="text-right">
									<div class="text-lg font-semibold {account.balance >= 0 ? 'text-green-600' : 'text-red-600'}">
										{formatCurrency(account.balance)}
									</div>
									<div class="text-xs text-gray-500">Current Balance</div>
								</div>

								{#if !account.is_active}
									<div class="mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
										Archived
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</Card>
			{/each}
		{/if}
	{/if}
</div>

<!-- Add Account Modal -->
<Modal bind:open={addModalOpen} title="Add New Account">
	<form onsubmit={(e) => { e.preventDefault(); handleSave(); }} class="space-y-6">
		{#if formErrors.length > 0}
			<div class="rounded-md bg-red-50 p-4">
				<ul class="text-sm text-red-700 space-y-1">
					{#each formErrors as error}
						<li>• {error}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<Input
			label="Account Name"
			bind:value={formData.name}
			placeholder="e.g., HDFC Checking, SBI Savings"
			required
		/>

		<div>
			<label for="account-type-add" class="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
			<select
				id="account-type-add"
				bind:value={formData.type}
				class="block w-full rounded-lg border-gray-300 px-3 py-2 text-sm"
				required
			>
				{#each accountTypes as type}
					<option value={type.value}>{type.label}</option>
				{/each}
			</select>
		</div>

		<Input
			label="Starting Balance"
			type="number"
			step="0.01"
			bind:value={formData.balance}
			placeholder="0.00"
		/>

		<div class="bg-blue-50 p-4 rounded-lg">
			<p class="text-sm text-blue-800">
				<strong>Tip:</strong> Enter your current account balance to get started. 
				You can always adjust this later if needed.
			</p>
		</div>
	</form>

	<div slot="footer">
		<Button variant="outline" on:click={() => addModalOpen = false}>
			Cancel
		</Button>
		<Button on:click={handleSave} loading={saving} disabled={saving}>
			{saving ? 'Adding...' : 'Add Account'}
		</Button>
	</div>
</Modal>

<!-- Edit Account Modal -->
<Modal bind:open={editModalOpen} title="Edit Account">
	<form onsubmit={(e) => { e.preventDefault(); handleSave(); }} class="space-y-6">
		{#if formErrors.length > 0}
			<div class="rounded-md bg-red-50 p-4">
				<ul class="text-sm text-red-700 space-y-1">
					{#each formErrors as error}
						<li>• {error}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<Input
			label="Account Name"
			bind:value={formData.name}
			placeholder="e.g., HDFC Checking, SBI Savings"
			required
		/>

		<div>
			<label for="account-type-edit" class="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
			<select
				id="account-type-edit"
				bind:value={formData.type}
				class="block w-full rounded-lg border-gray-300 px-3 py-2 text-sm"
				required
			>
				{#each accountTypes as type}
					<option value={type.value}>{type.label}</option>
				{/each}
			</select>
		</div>

		<Input
			label="Current Balance"
			type="number"
			step="0.01"
			bind:value={formData.balance}
			placeholder="0.00"
		/>
	</form>

	<div slot="footer">
		<Button variant="outline" on:click={() => editModalOpen = false}>
			Cancel
		</Button>
		<Button on:click={handleSave} loading={saving} disabled={saving}>
			{saving ? 'Saving...' : 'Save Changes'}
		</Button>
	</div>
</Modal>

<!-- Delete Account Modal -->
<Modal bind:open={deleteModalOpen} title="Delete Account">
	<div class="space-y-4">
		<p class="text-gray-600">
			Are you sure you want to permanently delete <strong>{selectedAccount?.name}</strong>?
		</p>

		<div class="bg-red-50 p-4 rounded-lg">
			<p class="text-sm text-red-800">
				<strong>⚠️ Warning:</strong> This action cannot be undone. The account will be permanently removed from your system.
				If this account has any transaction history, use "Archive" instead.
			</p>
		</div>
	</div>

	<div slot="footer">
		<Button variant="outline" on:click={() => deleteModalOpen = false}>
			Cancel
		</Button>
		<Button variant="danger" on:click={handleDelete}>
			Delete Permanently
		</Button>
	</div>
</Modal>

<!-- Archive Account Modal -->
<Modal bind:open={archiveModalOpen} title="Archive Account">
	<div class="space-y-4">
		<p class="text-gray-600">
			Are you sure you want to archive <strong>{selectedAccount?.name}</strong>?
		</p>

		<div class="bg-yellow-50 p-4 rounded-lg">
			<p class="text-sm text-yellow-800">
				Archiving will hide this account from your active accounts list, but all transaction 
				history will be preserved. You can reactivate it later if needed.
			</p>
		</div>
	</div>

	<div slot="footer">
		<Button variant="outline" on:click={() => archiveModalOpen = false}>
			Cancel
		</Button>
		<Button variant="danger" on:click={handleArchive}>
			Archive Account
		</Button>
	</div>
</Modal>
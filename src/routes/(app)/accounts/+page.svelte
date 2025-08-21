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

	onMount(() => {
		// Load accounts asynchronously
		loadAccounts();

		// Listen for FAB click events
		const handleFabClick = (event: CustomEvent) => {
			if (event.detail.page === '/accounts') {
				openAddModal();
			}
		};

		window.addEventListener('fab-click', handleFabClick as EventListener);

		// Return cleanup function
		return () => {
			window.removeEventListener('fab-click', handleFabClick as EventListener);
		};
	});

	async function loadAccounts() {
		try {
			loading = true;
			const [accountsData, summaryData] = await Promise.all([getAccounts(), getAccountSummary()]);

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
			setTimeout(() => (success = ''), 3000);
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
			setTimeout(() => (success = ''), 3000);
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
			setTimeout(() => (success = ''), 3000);
		} catch (err: any) {
			error = err.message || 'Failed to delete account';
		}
	}

	async function handleReactivate(account: Account) {
		try {
			await reactivateAccount(account.id);
			await loadAccounts();
			success = 'Account reactivated successfully';
			setTimeout(() => (success = ''), 3000);
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

	let groupedAccounts = $state<Record<string, Account[]>>({});

	// Update grouped accounts whenever accounts change
	$effect(() => {
		const groups: Record<string, Account[]> = {};
		accounts.forEach((account) => {
			const type = account.type;
			if (!groups[type]) {
				groups[type] = [];
			}
			groups[type].push(account);
		});
		groupedAccounts = groups;
	});
</script>

<svelte:head>
	<title>Accounts - Family Finance</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
	<!-- Professional Header Section -->
	<div class="relative overflow-hidden">
		<!-- Background Pattern -->
		<div class="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700"></div>
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
									d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
								/>
							</svg>
						</div>
						<div>
							<h1 class="text-3xl font-bold text-white sm:text-4xl">Accounts</h1>
							<p class="mt-1 text-base text-blue-100 opacity-90 sm:text-lg">
								Manage your family's bank accounts and track balances
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
							Add Account
						</span>
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Content Section -->
	<div class="relative">
		<div class="space-y-8 px-4 py-8 pb-12 sm:px-6 lg:px-8">
			{#if loading}
				<div class="py-12 text-center">
					<div class="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
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
				<div class="grid grid-cols-1 gap-6 md:grid-cols-4">
					<Card class="text-center">
						<div class="text-2xl font-bold text-green-600">
							{formatCurrency(summary.total_assets)}
						</div>
						<p class="mt-1 text-sm text-gray-600">Total Assets</p>
					</Card>

					<Card class="text-center">
						<div class="text-2xl font-bold text-red-600">
							{formatCurrency(summary.total_liabilities)}
						</div>
						<p class="mt-1 text-sm text-gray-600">Total Liabilities</p>
					</Card>

					<Card class="text-center">
						<div
							class="text-2xl font-bold {summary.net_worth >= 0
								? 'text-green-600'
								: 'text-red-600'}"
						>
							{formatCurrency(summary.net_worth)}
						</div>
						<p class="mt-1 text-sm text-gray-600">Net Worth</p>
					</Card>

					<Card class="text-center">
						<div class="text-2xl font-bold text-blue-600">{summary.account_count}</div>
						<p class="mt-1 text-sm text-gray-600">Active Accounts</p>
					</Card>
				</div>

				<!-- Accounts by Type -->
				{#if accounts.length === 0}
					<Card class="py-12 text-center">
						<div
							class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100"
						>
							<span class="text-3xl">🏦</span>
						</div>
						<h3 class="mb-2 text-lg font-medium text-gray-900">No accounts yet</h3>
						<p class="mb-6 text-gray-600">
							Add your first account to start tracking your family's finances.
						</p>
						<Button on:click={openAddModal}>Add Your First Account</Button>
					</Card>
				{:else}
					{#each Object.entries(groupedAccounts) as [type, typeAccounts]}
						<Card class="mb-6">
							<div class="mb-6 flex items-center justify-between">
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
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
								{#each typeAccounts as account (account.id)}
									<div
										class="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
									>
										<div class="mb-3 flex items-start justify-between">
											<div class="flex items-center space-x-3">
												<div
													class="h-10 w-10 {getAccountColorClasses(account.type)
														.bg} flex items-center justify-center rounded-full"
												>
													<span class="text-lg">{accountTypeIcons[account.type]}</span>
												</div>
												<div>
													<h4 class="font-medium text-gray-900">{account.name}</h4>
													<p class="text-xs text-gray-500">{accountTypeLabels[account.type]}</p>
												</div>
											</div>
											<div class="flex items-center space-x-1">
												<!-- Edit Button -->
												<button
													onclick={() => openEditModal(account)}
													class="rounded-md p-2 text-gray-400 hover:text-blue-600"
													title="Edit account"
													aria-label="Edit account {account.name}"
												>
													<svg
														class="h-5 w-5"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
														/>
													</svg>
												</button>

												{#if account.is_active}
													<!-- Delete Button -->
													<button
														onclick={() => openDeleteModal(account)}
														class="rounded-md p-2 text-gray-400 hover:text-red-600"
														title="Delete account"
														aria-label="Delete account {account.name}"
													>
														<svg
															class="h-5 w-5"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
															/>
														</svg>
													</button>

													<!-- Archive Button -->
													<button
														onclick={() => openArchiveModal(account)}
														class="rounded-md p-2 text-gray-400 hover:text-orange-600"
														title="Archive account"
														aria-label="Archive account {account.name}"
													>
														<svg
															class="h-5 w-5"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M5 8l4 4 4-4m0 0V4a1 1 0 011-1h4a1 1 0 011 1v4m-6 0h6m-6 0V8"
															/>
														</svg>
													</button>
												{:else}
													<!-- Reactivate Button -->
													<button
														onclick={() => handleReactivate(account)}
														class="rounded-md p-2 text-gray-400 hover:text-green-600"
														title="Reactivate account"
														aria-label="Reactivate account {account.name}"
													>
														<svg
															class="h-5 w-5"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
															/>
														</svg>
													</button>
												{/if}
											</div>
										</div>

										<div class="text-right">
											<div
												class="text-lg font-semibold {account.balance >= 0
													? 'text-green-600'
													: 'text-red-600'}"
											>
												{formatCurrency(account.balance)}
											</div>
											<div class="text-xs text-gray-500">Current Balance</div>
										</div>

										{#if !account.is_active}
											<div class="mt-2 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
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
	</div>
</div>

<!-- Add Account Modal -->
<Modal bind:open={addModalOpen} title="Add New Account">
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

		<Input
			label="Account Name"
			bind:value={formData.name}
			placeholder="e.g., HDFC Checking, SBI Savings"
			required
		/>

		<div>
			<label for="account-type-add" class="mb-1 block text-sm font-medium text-gray-700"
				>Account Type</label
			>
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

		<div class="rounded-lg bg-blue-50 p-4">
			<p class="text-sm text-blue-800">
				<strong>Tip:</strong> Enter your current account balance to get started. You can always adjust
				this later if needed.
			</p>
		</div>
	</form>

	<div slot="footer">
		<Button variant="outline" on:click={() => (addModalOpen = false)}>Cancel</Button>
		<Button on:click={handleSave} loading={saving} disabled={saving}>
			{saving ? 'Adding...' : 'Add Account'}
		</Button>
	</div>
</Modal>

<!-- Edit Account Modal -->
<Modal bind:open={editModalOpen} title="Edit Account">
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

		<Input
			label="Account Name"
			bind:value={formData.name}
			placeholder="e.g., HDFC Checking, SBI Savings"
			required
		/>

		<div>
			<label for="account-type-edit" class="mb-1 block text-sm font-medium text-gray-700"
				>Account Type</label
			>
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
		<Button variant="outline" on:click={() => (editModalOpen = false)}>Cancel</Button>
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

		<div class="rounded-lg bg-red-50 p-4">
			<p class="text-sm text-red-800">
				<strong>⚠️ Warning:</strong> This action cannot be undone. The account will be permanently removed
				from your system. If this account has any transaction history, use "Archive" instead.
			</p>
		</div>
	</div>

	<div slot="footer">
		<Button variant="outline" on:click={() => (deleteModalOpen = false)}>Cancel</Button>
		<Button variant="danger" on:click={handleDelete}>Delete Permanently</Button>
	</div>
</Modal>

<!-- Archive Account Modal -->
<Modal bind:open={archiveModalOpen} title="Archive Account">
	<div class="space-y-4">
		<p class="text-gray-600">
			Are you sure you want to archive <strong>{selectedAccount?.name}</strong>?
		</p>

		<div class="rounded-lg bg-yellow-50 p-4">
			<p class="text-sm text-yellow-800">
				Archiving will hide this account from your active accounts list, but all transaction history
				will be preserved. You can reactivate it later if needed.
			</p>
		</div>
	</div>

	<div slot="footer">
		<Button variant="outline" on:click={() => (archiveModalOpen = false)}>Cancel</Button>
		<Button variant="danger" on:click={handleArchive}>Archive Account</Button>
	</div>
</Modal>

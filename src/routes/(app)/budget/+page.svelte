<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Input, Card, Modal } from '$lib/components';
	import { formatCurrency } from '$lib/components/charts/ChartUtils';
	import { 
		getBudgetForMonth, 
		getBudgetSummary,
		createOrUpdateBudget, 
		initializeBudgetForMonth,
		copyBudgetFromPreviousMonth,
		moveMoney,
		getCurrentMonth,
		formatMonthDisplay,
		validateBudgetData
	} from '$lib/services/budgetService';
	import { getCategories, categoryTypeLabels, categoryTypeIcons, categoryTypeColors } from '$lib/services/categoryService';
	import type { Budget, BudgetFormData, Category, CategoryType } from '$lib/types';

	let budgets: Budget[] = $state([]);
	let categories: Category[] = $state([]);
	let currentMonth = $state(getCurrentMonth());
	let summary = $state({
		total_income_budgeted: 0,
		total_expenses_budgeted: 0,
		total_spent: 0,
		total_available: 0,
		unallocated_income: 0,
		category_count: 0,
		overspent_categories: 0
	});
	
	let loading = $state(true);
	let error = $state('');
	let success = $state('');

	// Modal states
	let allocateModalOpen = $state(false);
	let moveMoneyModalOpen = $state(false);
	let selectedCategory: Category | null = $state(null);

	// Form states
	let allocateFormData: BudgetFormData = $state({
		category_id: '',
		month_year: '',
		allocated_amount: ''
	});
	let moveFromCategory = $state('');
	let moveToCategory = $state('');
	let moveAmount = $state('');
	let formErrors: string[] = $state([]);
	let saving = $state(false);

	// Delete modal states
	let deleteModalOpen = $state(false);
	let budgetToDelete: Budget | null = $state(null);

	onMount(async () => {
		await loadBudgetData();
	});

	async function loadBudgetData() {
		try {
			loading = true;
			error = '';

			// Initialize budget for current month if needed
			await initializeBudgetForMonth(currentMonth);

			const [budgetData, categoriesData, summaryData] = await Promise.all([
				getBudgetForMonth(currentMonth),
				getCategories(),
				getBudgetSummary(currentMonth)
			]);
			
			budgets = budgetData;
			categories = categoriesData.filter(cat => cat.is_active);
			summary = summaryData;
		} catch (err: any) {
			error = err.message || 'Failed to load budget data';
		} finally {
			loading = false;
		}
	}

	async function handleMonthChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		currentMonth = target.value;
		allocateFormData.month_year = currentMonth;
		await loadBudgetData();
	}

	function openAllocateModal(category?: Category) {
		selectedCategory = category || null;
		const existingBudget = budgets.find(b => b.category_id === category?.id);
		
		allocateFormData = {
			category_id: category?.id || '',
			month_year: currentMonth,
			allocated_amount: existingBudget?.allocated_amount.toString() || ''
		};
		formErrors = [];
		allocateModalOpen = true;
	}

	function openMoveMoneyModal() {
		moveFromCategory = '';
		moveToCategory = '';
		moveAmount = '';
		formErrors = [];
		moveMoneyModalOpen = true;
	}

	async function handleAllocate() {
		formErrors = validateBudgetData(allocateFormData);
		if (formErrors.length > 0) return;

		try {
			saving = true;
			error = '';

			await createOrUpdateBudget(allocateFormData);
			allocateModalOpen = false;
			await loadBudgetData();
			success = 'Budget allocation updated successfully';
			setTimeout(() => success = '', 3000);
		} catch (err: any) {
			error = err.message || 'Failed to allocate budget';
		} finally {
			saving = false;
		}
	}

	async function handleMoveMoney() {
		// Validation
		const errors: string[] = [];
		if (!moveFromCategory) errors.push('Source category is required');
		if (!moveToCategory) errors.push('Destination category is required');
		if (moveFromCategory === moveToCategory) errors.push('Source and destination must be different');
		if (!moveAmount || isNaN(parseFloat(moveAmount))) errors.push('Valid amount is required');
		if (parseFloat(moveAmount) <= 0) errors.push('Amount must be positive');

		formErrors = errors;
		if (errors.length > 0) return;

		try {
			saving = true;
			error = '';

			await moveMoney(moveFromCategory, moveToCategory, parseFloat(moveAmount), currentMonth);
			moveMoneyModalOpen = false;
			await loadBudgetData();
			success = 'Money moved successfully between categories';
			setTimeout(() => success = '', 3000);
		} catch (err: any) {
			error = err.message || 'Failed to move money';
		} finally {
			saving = false;
		}
	}

	async function handleCopyFromPrevious() {
		try {
			loading = true;
			await copyBudgetFromPreviousMonth(currentMonth);
			await loadBudgetData();
			success = 'Budget copied from previous month successfully';
			setTimeout(() => success = '', 3000);
		} catch (err: any) {
			error = err.message || 'Failed to copy budget from previous month';
		}
	}

	async function quickAllocate(categoryId: string, amount: number) {
		try {
			const formData: BudgetFormData = {
				category_id: categoryId,
				month_year: currentMonth,
				allocated_amount: amount.toString()
			};

			await createOrUpdateBudget(formData);
			await loadBudgetData();
		} catch (err: any) {
			error = err.message || 'Failed to allocate budget';
		}
	}

	async function handleDeleteBudget() {
		if (!budgetToDelete) return;

		try {
			// Set allocation to 0 to effectively "delete" the budget
			const formData: BudgetFormData = {
				category_id: budgetToDelete.category_id,
				month_year: currentMonth,
				allocated_amount: '0'
			};

			await createOrUpdateBudget(formData);
			deleteModalOpen = false;
			await loadBudgetData();
			success = 'Budget allocation removed successfully';
			setTimeout(() => success = '', 3000);
		} catch (err: any) {
			error = err.message || 'Failed to remove budget allocation';
		}
	}

	function openDeleteModal(budget: Budget) {
		budgetToDelete = budget;
		deleteModalOpen = true;
	}

	function getBudgetForCategory(categoryId: string): Budget | undefined {
		return budgets.find(b => b.category_id === categoryId);
	}

	function getBudgetStatusColor(budget: Budget): string {
		if (budget.available_amount < 0) return 'text-red-600';
		if (budget.available_amount === 0) return 'text-yellow-600';
		return 'text-green-600';
	}

	function getBudgetStatusText(budget: Budget): string {
		if (budget.available_amount < 0) return 'Overspent';
		if (budget.available_amount === 0) return 'Fully Allocated';
		return 'Available';
	}

	const groupedCategories = $derived(() => {
		const groups: Record<string, Category[]> = {};
		categories.forEach(category => {
			if (!groups[category.type]) {
				groups[category.type] = [];
			}
			groups[category.type].push(category);
		});
		return groups;
	});

	const incomeCategories = $derived(() => {
		return categories.filter(cat => cat.type === 'income');
	});

	const expenseCategories = $derived(() => {
		const groups: Record<string, Category[]> = {};
		categories.forEach(category => {
			if (category.type !== 'income') {
				if (!groups[category.type]) {
					groups[category.type] = [];
				}
				groups[category.type].push(category);
			}
		});
		return groups;
	});

	const availableBudgets = $derived(() => {
		return budgets.filter(b => b.available_amount > 0);
	});

	// Generate month options (current month + 11 months forward/backward)
	const monthOptions = $derived(() => {
		const options = [];
		const currentDate = new Date();
		
		for (let i = -6; i <= 6; i++) {
			const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
			const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
			options.push({
				value: monthYear,
				label: formatMonthDisplay(monthYear)
			});
		}
		
		return options;
	});
</script>

<svelte:head>
	<title>Budget - Family Finance</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
	<!-- Professional Header Section -->
	<div class="relative overflow-hidden">
		<!-- Background Pattern -->
		<div class="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-700"></div>
		<div class="absolute inset-0 bg-black/10"></div>
		<div class="absolute inset-0" style="background-image: radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)"></div>
		
		<div class="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
			<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
				<div class="flex-1">
					<div class="flex items-center space-x-3 mb-4">
						<div class="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
							<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
							</svg>
						</div>
						<div>
							<h1 class="text-3xl sm:text-4xl font-bold text-white">Monthly Budget</h1>
							<p class="text-purple-100 text-base sm:text-lg opacity-90 mt-1">
								Give every rupee a job - YNAB Rule 1
							</p>
						</div>
					</div>
				</div>
				
				<div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
					<div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
						<label for="month-select" class="block text-sm font-medium text-white/90 mb-2">Month</label>
						<select
							id="month-select"
							bind:value={currentMonth}
							onchange={handleMonthChange}
							class="block rounded-lg border-gray-300 px-3 py-2 text-sm min-w-[160px] bg-white"
						>
							{#each monthOptions() as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
					
					<div class="flex space-x-3">
						<button
							onclick={handleCopyFromPrevious}
							class="group bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-semibold py-3 px-5 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
						>
							<span class="inline-flex items-center">
								<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
								</svg>
								Copy Previous
							</span>
						</button>
						<button
							onclick={() => openAllocateModal()}
							class="group bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
						>
							<span class="inline-flex items-center">
								<svg class="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
								</svg>
								Allocate Money
							</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Content Section -->
	<div class="relative">
		<div class="px-4 sm:px-6 lg:px-8 py-8 pb-12 space-y-6">

	{#if loading}
		<div class="text-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
			<p class="mt-2 text-gray-600">Loading budget...</p>
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

		<!-- Budget Summary -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
			<Card class="text-center">
				<div class="text-2xl font-bold text-blue-600">{formatCurrency(summary.total_income_budgeted)}</div>
				<p class="text-sm text-gray-600 mt-1">Income Budgeted</p>
			</Card>
			
			<Card class="text-center">
				<div class="text-2xl font-bold text-orange-600">{formatCurrency(summary.total_expenses_budgeted)}</div>
				<p class="text-sm text-gray-600 mt-1">Expenses Budgeted</p>
			</Card>
			
			<Card class="text-center">
				<div class="text-2xl font-bold {summary.unallocated_income >= 0 ? 'text-green-600' : 'text-red-600'}">
					{formatCurrency(summary.unallocated_income)}
				</div>
				<p class="text-sm text-gray-600 mt-1">
					{summary.unallocated_income >= 0 ? 'Unallocated' : 'Over-allocated'}
				</p>
			</Card>
			
			<Card class="text-center">
				<div class="text-2xl font-bold text-gray-900">{summary.overspent_categories}</div>
				<p class="text-sm text-gray-600 mt-1">Overspent Categories</p>
			</Card>
		</div>

		<!-- YNAB Rule 1 Alert -->
		{#if summary.unallocated_income !== 0}
			<div class="rounded-md {summary.unallocated_income > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'} border p-4">
				<div class="flex items-center">
					<span class="text-2xl mr-3">{summary.unallocated_income > 0 ? '💡' : '⚠️'}</span>
					<div>
						<h3 class="font-medium {summary.unallocated_income > 0 ? 'text-yellow-800' : 'text-red-800'}">
							{summary.unallocated_income > 0 ? 'Unallocated Money Available' : 'Over-allocated Budget!'}
						</h3>
						<p class="text-sm {summary.unallocated_income > 0 ? 'text-yellow-700' : 'text-red-700'}">
							{summary.unallocated_income > 0 
								? `You have ${formatCurrency(summary.unallocated_income)} waiting to be assigned. Give every rupee a job!`
								: `You've allocated ${formatCurrency(Math.abs(summary.unallocated_income))} more than your income. Adjust your budget.`
							}
						</p>
						{#if summary.unallocated_income > 0}
							<div class="mt-2">
								<Button size="sm" on:click={() => openAllocateModal()}>
									Allocate Now
								</Button>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Income Section -->
		{#if incomeCategories().length > 0}
			<Card class="mb-6">
				<div class="flex items-center justify-between mb-6">
					<div class="flex items-center space-x-3">
						<span class="text-2xl">💰</span>
						<div>
							<h3 class="text-lg font-semibold text-gray-900">Income</h3>
							<p class="text-sm text-gray-600">
								Expected monthly income sources
							</p>
						</div>
					</div>
				</div>

				<div class="space-y-4">
					{#each incomeCategories() as category (category.id)}
						{@const budget = getBudgetForCategory(category.id)}
						<div class="border border-gray-200 rounded-lg p-4">
							<div class="flex items-center justify-between">
								<div class="flex-1">
									<div class="flex items-center justify-between mb-2">
										<h4 class="font-medium text-gray-900">{category.name}</h4>
										<div class="flex items-center space-x-2">
											<button
												onclick={() => openAllocateModal(category)}
												class="text-sm text-blue-600 hover:text-blue-800"
											>
												{budget ? 'Edit' : 'Set Expected'}
											</button>
											{#if budget && budget.allocated_amount > 0}
												<button
													onclick={() => openDeleteModal(budget)}
													class="text-sm text-red-600 hover:text-red-800"
												>
													Remove
												</button>
											{/if}
										</div>
									</div>
									
									{#if budget}
										<div class="text-sm">
											<div class="text-gray-600">Expected Income</div>
											<div class="font-semibold text-green-600">{formatCurrency(budget.allocated_amount)}</div>
										</div>
									{:else}
										<div class="text-sm text-gray-500">
											No expected income set for this source
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</Card>
		{/if}

		<!-- Budget Categories -->
		{#if budgets.length === 0}
			<Card class="text-center py-12">
				<div class="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
					<span class="text-3xl">📊</span>
				</div>
				<h3 class="text-lg font-medium text-gray-900 mb-2">No budget allocated yet</h3>
				<p class="text-gray-600 mb-6">
					Start allocating your income to categories to follow YNAB methodology.
				</p>
				<Button on:click={() => openAllocateModal()}>Start Budgeting</Button>
			</Card>
		{:else}
			{#each Object.entries(expenseCategories) as [type, typeCategories]}
				<Card class="mb-6">
					<div class="flex items-center justify-between mb-6">
						<div class="flex items-center space-x-3">
							<span class="text-2xl">{categoryTypeIcons[type as CategoryType]}</span>
							<div>
								<h3 class="text-lg font-semibold text-gray-900">{categoryTypeLabels[type as CategoryType]}</h3>
								<p class="text-sm text-gray-600">
									{typeCategories.length} categories
								</p>
							</div>
						</div>
					</div>

					<div class="space-y-4">
						{#each typeCategories as category (category.id)}
							{@const budget = getBudgetForCategory(category.id)}
							<div class="border border-gray-200 rounded-lg p-4">
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<div class="flex items-center justify-between mb-2">
											<h4 class="font-medium text-gray-900">{category.name}</h4>
											<div class="flex items-center space-x-2">
												<button
													onclick={() => openAllocateModal(category)}
													class="text-sm text-blue-600 hover:text-blue-800"
												>
													{budget ? 'Edit' : 'Allocate'}
												</button>
												{#if budget && budget.allocated_amount > 0}
													<button
														onclick={() => openDeleteModal(budget)}
														class="text-sm text-red-600 hover:text-red-800"
													>
														Remove
													</button>
												{/if}
											</div>
										</div>
										
										{#if budget}
											<div class="grid grid-cols-3 gap-4 text-sm">
												<div>
													<div class="text-gray-600">Budgeted</div>
													<div class="font-semibold">{formatCurrency(budget.allocated_amount)}</div>
												</div>
												<div>
													<div class="text-gray-600">Spent</div>
													<div class="font-semibold text-red-600">{formatCurrency(budget.spent_amount)}</div>
												</div>
												<div>
													<div class="text-gray-600">Available</div>
													<div class="font-semibold {getBudgetStatusColor(budget)}">
														{formatCurrency(budget.available_amount)}
													</div>
												</div>
											</div>
											
											<!-- Progress Bar -->
											<div class="mt-3">
												<div class="flex items-center justify-between text-xs text-gray-600 mb-1">
													<span>{getBudgetStatusText(budget)}</span>
													<span>
														{budget.allocated_amount > 0 ? 
															Math.round((budget.spent_amount / budget.allocated_amount) * 100) : 0}%
													</span>
												</div>
												<div class="w-full bg-gray-200 rounded-full h-2">
													<div 
														class="h-2 rounded-full {budget.available_amount < 0 ? 'bg-red-500' : 'bg-green-500'}"
														style="width: {Math.min(100, budget.allocated_amount > 0 ? (budget.spent_amount / budget.allocated_amount) * 100 : 0)}%"
													></div>
												</div>
											</div>
										{:else}
											<div class="text-sm text-gray-500">
												No budget allocated for this category
											</div>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</Card>
			{/each}

			<!-- Quick Actions -->
			{#if availableBudgets().length > 0}
				<Card title="Quick Actions" class="mb-6">
					<div class="flex items-center justify-between">
						<p class="text-sm text-gray-600">
							Move money between categories or make quick allocations
						</p>
						<Button variant="outline" on:click={openMoveMoneyModal}>
							Move Money
						</Button>
					</div>
				</Card>
			{/if}
		{/if}
	{/if}
		</div>
	</div>
</div>

<!-- Allocate Money Modal -->
<Modal bind:open={allocateModalOpen} title={selectedCategory ? `Allocate to ${selectedCategory.name}` : 'Allocate Money'}>
	<form onsubmit={(e) => { e.preventDefault(); handleAllocate(); }} class="space-y-6">
		{#if formErrors.length > 0}
			<div class="rounded-md bg-red-50 p-4">
				<ul class="text-sm text-red-700 space-y-1">
					{#each formErrors as error}
						<li>• {error}</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if !selectedCategory}
			<div>
				<label for="allocate-category" class="block text-sm font-medium text-gray-700 mb-1">Category *</label>
				<select
					id="allocate-category"
					bind:value={allocateFormData.category_id}
					class="block w-full rounded-lg border-gray-300 px-3 py-2 text-sm"
					required
				>
					<option value="">Select a category</option>
					{#each categories as category}
						<option value={category.id}>{category.name} ({categoryTypeLabels[category.type]})</option>
					{/each}
				</select>
			</div>
		{/if}

		<Input
			label="Amount to Allocate *"
			type="number"
			step="0.01"
			bind:value={allocateFormData.allocated_amount}
			placeholder="0.00"
			required
		/>

		<div class="bg-blue-50 p-4 rounded-lg">
			<p class="text-sm text-blue-800">
				<strong>Available to allocate:</strong> {formatCurrency(summary.unallocated_income)}
			</p>
			{#if summary.unallocated_income <= 0}
				<p class="text-sm text-blue-700 mt-1">
					You'll need to move money from other categories to allocate more here.
				</p>
			{/if}
		</div>
	</form>

	<div slot="footer">
		<Button variant="outline" on:click={() => allocateModalOpen = false}>
			Cancel
		</Button>
		<Button on:click={handleAllocate} loading={saving} disabled={saving}>
			{saving ? 'Allocating...' : 'Allocate Money'}
		</Button>
	</div>
</Modal>

<!-- Move Money Modal -->
<Modal bind:open={moveMoneyModalOpen} title="Move Money Between Categories">
	<form onsubmit={(e) => { e.preventDefault(); handleMoveMoney(); }} class="space-y-6">
		{#if formErrors.length > 0}
			<div class="rounded-md bg-red-50 p-4">
				<ul class="text-sm text-red-700 space-y-1">
					{#each formErrors as error}
						<li>• {error}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div>
			<label for="move-from-category" class="block text-sm font-medium text-gray-700 mb-1">From Category *</label>
			<select
				id="move-from-category"
				bind:value={moveFromCategory}
				class="block w-full rounded-lg border-gray-300 px-3 py-2 text-sm"
				required
			>
				<option value="">Select source category</option>
				{#each availableBudgets() as budget}
					{@const category = categories.find(c => c.id === budget.category_id)}
					{#if category}
						<option value={budget.category_id}>
							{category.name} (Available: {formatCurrency(budget.available_amount)})
						</option>
					{/if}
				{/each}
			</select>
		</div>

		<div>
			<label for="move-to-category" class="block text-sm font-medium text-gray-700 mb-1">To Category *</label>
			<select
				id="move-to-category"
				bind:value={moveToCategory}
				class="block w-full rounded-lg border-gray-300 px-3 py-2 text-sm"
				required
			>
				<option value="">Select destination category</option>
				{#each categories.filter(c => c.type !== 'income') as category}
					<option value={category.id}>{category.name}</option>
				{/each}
			</select>
		</div>

		<Input
			label="Amount to Move *"
			type="number"
			step="0.01"
			bind:value={moveAmount}
			placeholder="0.00"
			required
		/>

		<div class="bg-yellow-50 p-4 rounded-lg">
			<p class="text-sm text-yellow-800">
				Moving money helps you stay within your total budget while adjusting 
				allocations between categories as needed.
			</p>
		</div>
	</form>

	<div slot="footer">
		<Button variant="outline" on:click={() => moveMoneyModalOpen = false}>
			Cancel
		</Button>
		<Button on:click={handleMoveMoney} loading={saving} disabled={saving}>
			{saving ? 'Moving...' : 'Move Money'}
		</Button>
	</div>
</Modal>

<!-- Delete Budget Modal -->
<Modal bind:open={deleteModalOpen} title="Remove Budget Allocation">
	<div class="space-y-4">
		<p class="text-gray-600">
			Are you sure you want to remove the budget allocation for <strong>{categories.find(c => c.id === budgetToDelete?.category_id)?.name || 'this category'}</strong>?
		</p>

		<div class="bg-yellow-50 p-4 rounded-lg">
			<p class="text-sm text-yellow-800">
				This will set the allocated amount to ₹0. You can always set a new budget allocation later.
			</p>
		</div>
	</div>

	<div slot="footer">
		<Button variant="outline" on:click={() => deleteModalOpen = false}>
			Cancel
		</Button>
		<Button variant="danger" on:click={handleDeleteBudget}>
			Remove Allocation
		</Button>
	</div>
</Modal>
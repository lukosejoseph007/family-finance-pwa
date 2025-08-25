<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Input, Card, Modal } from '$lib/components';
	import { formatCurrency } from '$lib/utils/currency';
	import {
		getCategories,
		getCategorySummary,
		createCategory,
		updateCategory,
		deleteCategory,
		archiveCategory,
		reactivateCategory,
		initializeDefaultCategories,
		categoryTypeLabels,
		categoryTypeIcons,
		categoryTypeColors,
		validateCategoryData
	} from '$lib/services/categoryService';
	import type { Category, CategoryFormData, CategoryType } from '$lib/types';

	let categories: Category[] = $state([]);
	let summary = $state({
		total_budget: 0,
		allocated_amount: 0,
		category_count: 0,
		by_type: {
			immediate_obligations: { count: 0, budget: 0 },
			true_expenses: { count: 0, budget: 0 },
			quality_of_life: { count: 0, budget: 0 },
			just_for_fun: { count: 0, budget: 0 },
			income: { count: 0, budget: 0 }
		}
	});
	let loading = $state(true);
	let error = $state('');
	let success = $state('');

	// Modal states
	let addModalOpen = $state(false);
	let editModalOpen = $state(false);
	let archiveModalOpen = $state(false);
	let deleteModalOpen = $state(false);
	let selectedCategory: Category | null = $state(null);

	// Form states
	let formData: CategoryFormData = $state({
		name: '',
		type: 'immediate_obligations',
		description: '',
		budget_amount: ''
	});
	let formErrors: string[] = $state([]);
	let saving = $state(false);

	const categoryTypes: { value: CategoryType; label: string }[] = [
		{ value: 'immediate_obligations', label: 'Immediate Obligations' },
		{ value: 'true_expenses', label: 'True Expenses' },
		{ value: 'quality_of_life', label: 'Quality of Life Goals' },
		{ value: 'just_for_fun', label: 'Just for Fun' },
		{ value: 'income', label: 'Income' }
	];

	onMount(() => {
		// Load categories asynchronously
		loadCategories();

		// Listen for FAB click events
		const handleFabClick = (event: CustomEvent) => {
			if (event.detail.page === '/categories') {
				openAddModal();
			}
		};

		window.addEventListener('fab-click', handleFabClick as EventListener);

		// Return cleanup function
		return () => {
			window.removeEventListener('fab-click', handleFabClick as EventListener);
		};
	});

	async function loadCategories() {
		try {
			loading = true;
			const [categoriesData, summaryData] = await Promise.all([
				getCategories(),
				getCategorySummary()
			]);

			categories = categoriesData; // Show all categories including archived
			summary = summaryData;

			// If no categories exist, initialize with defaults
			if (categories.length === 0) {
				await initializeDefaultCategories();
				await loadCategories(); // Reload after initialization
				return;
			}
		} catch (err: any) {
			error = err.message || 'Failed to load categories';
		} finally {
			loading = false;
		}
	}

	function openAddModal() {
		formData = { name: '', type: 'immediate_obligations', description: '', budget_amount: '' };
		formErrors = [];
		addModalOpen = true;
	}

	function openEditModal(category: Category) {
		selectedCategory = category;
		formData = {
			name: category.name,
			type: category.type,
			description: category.description || '',
			budget_amount: category.budget_amount.toString()
		};
		formErrors = [];
		editModalOpen = true;
	}

	function openArchiveModal(category: Category) {
		selectedCategory = category;
		archiveModalOpen = true;
	}

	function openDeleteModal(category: Category) {
		selectedCategory = category;
		deleteModalOpen = true;
	}

	async function handleSave() {
		formErrors = validateCategoryData(formData);
		if (formErrors.length > 0) return;

		try {
			saving = true;
			error = '';

			if (editModalOpen && selectedCategory) {
				await updateCategory(selectedCategory.id, formData);
				editModalOpen = false;
				success = 'Category updated successfully';
			} else {
				await createCategory(formData);
				addModalOpen = false;
				success = 'Category created successfully';
			}

			await loadCategories();
			setTimeout(() => (success = ''), 3000);
		} catch (err: any) {
			error = err.message || 'Failed to save category';
		} finally {
			saving = false;
		}
	}

	async function handleArchive() {
		if (!selectedCategory) return;

		try {
			await archiveCategory(selectedCategory.id);
			archiveModalOpen = false;
			await loadCategories();
			success = 'Category archived successfully';
			setTimeout(() => (success = ''), 3000);
		} catch (err: any) {
			error = err.message || 'Failed to archive category';
		}
	}

	async function handleDelete() {
		if (!selectedCategory) return;

		try {
			await deleteCategory(selectedCategory.id);
			deleteModalOpen = false;
			await loadCategories();
			success = 'Category deleted successfully';
			setTimeout(() => (success = ''), 3000);
		} catch (err: any) {
			error = err.message || 'Failed to delete category';
		}
	}

	async function handleReactivate(category: Category) {
		try {
			await reactivateCategory(category.id);
			await loadCategories();
			success = 'Category reactivated successfully';
			setTimeout(() => (success = ''), 3000);
		} catch (err: any) {
			error = err.message || 'Failed to reactivate category';
		}
	}

	function getCategoryColorClasses(type: CategoryType) {
		const color = categoryTypeColors[type];
		return {
			bg: `bg-${color}-100`,
			text: `text-${color}-800`,
			border: `border-${color}-200`
		};
	}

	let groupedCategories = $state<Record<string, Category[]>>({});
	let totalBudgeted = $state(0);
	let totalIncome = $state(0);
	let unallocated = $state(0);

	// Update computed values whenever categories change
	$effect(() => {
		// Update grouped categories
		const groups: Record<string, Category[]> = {};
		categories.forEach((category) => {
			if (!groups[category.type]) {
				groups[category.type] = [];
			}
			groups[category.type].push(category);
		});
		groupedCategories = groups;

		// Update totals
		totalBudgeted = categories
			.filter((cat) => cat.is_active && cat.type !== 'income')
			.reduce((sum, cat) => sum + cat.budget_amount, 0);

		totalIncome = categories
			.filter((cat) => cat.is_active && cat.type === 'income')
			.reduce((sum, cat) => sum + cat.budget_amount, 0);

		unallocated = totalIncome - totalBudgeted;
	});
</script>

<svelte:head>
	<title>Categories - Family Finance</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
	<!-- Professional Header Section -->
	<div class="relative overflow-hidden">
		<!-- Background Pattern -->
		<div class="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700"></div>
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
									d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
								/>
							</svg>
						</div>
						<div>
							<h1 class="text-3xl font-bold text-white sm:text-4xl">Budget Categories</h1>
							<p class="mt-1 text-base text-green-100 opacity-90 sm:text-lg">
								Organize your spending with the best budgeting methodology for families
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
							Add Category
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
					<p class="mt-2 text-gray-600">Loading categories...</p>
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

				<!-- Budget Summary Cards -->
				<div class="grid grid-cols-1 gap-6 md:grid-cols-4">
					<Card class="text-center">
						<div class="text-2xl font-bold text-blue-600">{formatCurrency(totalIncome)}</div>
						<p class="mt-1 text-sm text-gray-600">Monthly Income</p>
					</Card>

					<Card class="text-center">
						<div class="text-2xl font-bold text-orange-600">{formatCurrency(totalBudgeted)}</div>
						<p class="mt-1 text-sm text-gray-600">Total Budgeted</p>
					</Card>

					<Card class="text-center">
						<div class="text-2xl font-bold {unallocated >= 0 ? 'text-green-600' : 'text-red-600'}">
							{formatCurrency(unallocated)}
						</div>
						<p class="mt-1 text-sm text-gray-600">Unallocated</p>
					</Card>

					<Card class="text-center">
						<div class="text-2xl font-bold text-gray-900">{summary.category_count}</div>
						<p class="mt-1 text-sm text-gray-600">Active Categories</p>
					</Card>
				</div>

				<!-- YNAB Rule 1 Alert -->
				{#if unallocated !== 0}
					<div
						class="rounded-md {unallocated > 0
							? 'border-yellow-200 bg-yellow-50'
							: 'border-red-200 bg-red-50'} border p-4"
					>
						<div class="flex items-center">
							<span class="mr-3 text-2xl">{unallocated > 0 ? '💡' : '⚠️'}</span>
							<div>
								<h3 class="font-medium {unallocated > 0 ? 'text-yellow-800' : 'text-red-800'}">
									{unallocated > 0 ? 'Unallocated Money Available' : 'Over-budgeted!'}
								</h3>
								<p class="text-sm {unallocated > 0 ? 'text-yellow-700' : 'text-red-700'}">
									{unallocated > 0
										? `You have ${formatCurrency(unallocated)} waiting to be assigned. Give every rupee a job!`
										: `You've budgeted ${formatCurrency(Math.abs(unallocated))} more than your income. Adjust your budget.`}
								</p>
							</div>
						</div>
					</div>
				{/if}

				<!-- Categories by Type -->
				{#if categories.length === 0}
					<Card class="py-12 text-center">
						<div
							class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100"
						>
							<span class="text-3xl">📋</span>
						</div>
						<h3 class="mb-2 text-lg font-medium text-gray-900">No categories yet</h3>
						<p class="mb-6 text-gray-600">
							Create your first category to start organizing your family budget with our budgeting
							methodology.
						</p>
						<Button on:click={openAddModal}>Add Your First Category</Button>
					</Card>
				{:else}
					{#each Object.entries(groupedCategories) as [type, typeCategories]}
						<Card class="mb-6">
							<div class="mb-6 flex items-center justify-between">
								<div class="flex items-center space-x-3">
									<span class="text-2xl">{categoryTypeIcons[type as CategoryType]}</span>
									<div>
										<h3 class="text-lg font-semibold text-gray-900">
											{categoryTypeLabels[type as CategoryType]}
										</h3>
										<p class="text-sm text-gray-600">
											{summary.by_type[type as CategoryType]?.count || 0} categories •
											{formatCurrency(summary.by_type[type as CategoryType]?.budget || 0)} budgeted
										</p>
									</div>
								</div>
							</div>

							<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
								{#each typeCategories as category (category.id)}
									<div
										class="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
									>
										<div class="mb-3 flex items-start justify-between">
											<div class="flex-1">
												<h4 class="font-medium text-gray-900">{category.name}</h4>
												{#if category.description}
													<p class="mt-1 text-xs text-gray-500">{category.description}</p>
												{/if}
											</div>
											<div class="ml-2 flex items-center space-x-1">
												<!-- Edit Button -->
												<button
													onclick={() => openEditModal(category)}
													class="rounded-md p-2 text-gray-400 hover:text-blue-600"
													title="Edit category"
													aria-label="Edit category {category.name}"
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

												{#if category.is_active}
													<!-- Delete Button -->
													<button
														onclick={() => openDeleteModal(category)}
														class="rounded-md p-2 text-gray-400 hover:text-red-600"
														title="Delete category"
														aria-label="Delete category {category.name}"
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
														onclick={() => openArchiveModal(category)}
														class="rounded-md p-2 text-gray-400 hover:text-orange-600"
														title="Archive category"
														aria-label="Archive category {category.name}"
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
														onclick={() => handleReactivate(category)}
														class="rounded-md p-2 text-gray-400 hover:text-green-600"
														title="Reactivate category"
														aria-label="Reactivate category {category.name}"
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
											<div class="text-lg font-semibold text-gray-900">
												{formatCurrency(category.budget_amount)}
											</div>
											<div class="text-xs text-gray-500">
												{category.type === 'income' ? 'Expected Income' : 'Budgeted'}
											</div>
										</div>

										{#if !category.is_active}
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

<!-- Add Category Modal -->
<Modal bind:open={addModalOpen} title="Add New Category">
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
			label="Category Name"
			bind:value={formData.name}
			placeholder="e.g., Groceries, Rent, Entertainment"
			required
		/>

		<div>
			<label for="category-type-add" class="mb-1 block text-sm font-medium text-gray-700"
				>Category Type</label
			>
			<select
				id="category-type-add"
				bind:value={formData.type}
				class="block w-full rounded-lg border-gray-300 px-3 py-2 text-sm"
				required
			>
				{#each categoryTypes as type}
					<option value={type.value}>{type.label}</option>
				{/each}
			</select>
		</div>

		<Input
			label="Description (Optional)"
			bind:value={formData.description}
			placeholder="Brief description of this category"
		/>

		<Input
			label="Budget Amount"
			type="number"
			step="0.01"
			bind:value={formData.budget_amount}
			placeholder="0.00"
		/>

		<div class="rounded-lg bg-blue-50 p-4">
			<p class="text-sm text-blue-800">
				<strong>Budgeting Rule 1:</strong> Every penny must be accounted for. Set a realistic budget
				amount for this category based on your monthly income.
			</p>
		</div>
	</form>

	<div slot="footer">
		<Button variant="outline" on:click={() => (addModalOpen = false)}>Cancel</Button>
		<Button on:click={handleSave} loading={saving} disabled={saving}>
			{saving ? 'Adding...' : 'Add Category'}
		</Button>
	</div>
</Modal>

<!-- Edit Category Modal -->
<Modal bind:open={editModalOpen} title="Edit Category">
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
			label="Category Name"
			bind:value={formData.name}
			placeholder="e.g., Groceries, Rent, Entertainment"
			required
		/>

		<div>
			<label for="category-type-edit" class="mb-1 block text-sm font-medium text-gray-700"
				>Category Type</label
			>
			<select
				id="category-type-edit"
				bind:value={formData.type}
				class="block w-full rounded-lg border-gray-300 px-3 py-2 text-sm"
				required
			>
				{#each categoryTypes as type}
					<option value={type.value}>{type.label}</option>
				{/each}
			</select>
		</div>

		<Input
			label="Description (Optional)"
			bind:value={formData.description}
			placeholder="Brief description of this category"
		/>

		<Input
			label="Budget Amount"
			type="number"
			step="0.01"
			bind:value={formData.budget_amount}
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

<!-- Archive Category Modal -->
<Modal bind:open={archiveModalOpen} title="Archive Category">
	<div class="space-y-4">
		<p class="text-gray-600">
			Are you sure you want to archive <strong>{selectedCategory?.name}</strong>?
		</p>

		<div class="rounded-lg bg-yellow-50 p-4">
			<p class="text-sm text-yellow-800">
				Archiving will hide this category from your active budget, but all transaction history will
				be preserved. You can reactivate it later if needed.
			</p>
		</div>
	</div>

	<div slot="footer">
		<Button variant="outline" on:click={() => (archiveModalOpen = false)}>Cancel</Button>
		<Button variant="danger" on:click={handleArchive}>Archive Category</Button>
	</div>
</Modal>

<!-- Delete Category Modal -->
<Modal bind:open={deleteModalOpen} title="Delete Category">
	<div class="space-y-4">
		<p class="text-gray-600">
			Are you sure you want to permanently delete <strong>{selectedCategory?.name}</strong>?
		</p>

		<div class="rounded-lg bg-red-50 p-4">
			<p class="text-sm text-red-800">
				<strong>⚠️ Warning:</strong> This action cannot be undone. The category will be permanently removed
				from your system. If this category has any transactions or budgets, use "Archive" instead.
			</p>
		</div>
	</div>

	<div slot="footer">
		<Button variant="outline" on:click={() => (deleteModalOpen = false)}>Cancel</Button>
		<Button variant="danger" on:click={handleDelete}>Delete Permanently</Button>
	</div>
</Modal>

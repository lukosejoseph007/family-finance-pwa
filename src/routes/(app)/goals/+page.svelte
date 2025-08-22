<script lang="ts">
	import { onMount } from 'svelte';
	import { offlineStore } from '$lib/stores/offline';
	import { getFamilyGoals, createGoal, validateGoalData } from '$lib/services/goalService';
	import { formatCurrency } from '$lib/utils/currency';
	import type { Goal } from '$lib/types';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import BudgetProgressBar from '$lib/components/finance/BudgetProgressBar.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import type { GoalFormData } from '$lib/types';

	let goals: Goal[] = [];
	let loading = true;
	let error: string | null = null;
	let open = false;
	let formData: GoalFormData = {
		name: '',
		type: 'emergency_fund',
		target_amount: '',
		target_date: ''
	};
	let formErrors: Record<string, string> = {};
	let isOnline = true;

	// Track online status
	onMount(() => {
		const unsubscribe = offlineStore.subscribe((store) => {
			isOnline = store.isOnline;
		});
		return unsubscribe;
	});

	async function loadGoals() {
		try {
			loading = true;
			goals = await getFamilyGoals();
			error = null;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load goals';
		} finally {
			loading = false;
		}
	}

	function openModal() {
		if (!isOnline) {
			error = 'You are offline. Please connect to the internet to create a goal.';
			return;
		}
		formData = {
			name: '',
			type: 'emergency_fund',
			target_amount: '',
			target_date: ''
		};
		formErrors = {};
		open = true;
	}

	function handleInputEvent(field: string, e: Event) {
		const input = e.target as HTMLInputElement;
		formData = { ...formData, [field]: input.value };
		if (formErrors[field]) {
			formErrors = { ...formErrors, [field]: '' };
		}
	}

	function handleSelectEvent(field: string, e: Event) {
		const select = e.target as HTMLSelectElement;
		formData = { ...formData, [field]: select.value };
		if (formErrors[field]) {
			formErrors = { ...formErrors, [field]: '' };
		}
	}

	async function addGoal() {
		formErrors = {};
		const errors = validateGoalData(formData);
		
		if (errors.length > 0) {
			errors.forEach((err) => {
				const field = err.toLowerCase().includes('name') 
					? 'name' 
					: err.toLowerCase().includes('amount') 
						? 'target_amount' 
						: 'target_date';
				formErrors = { ...formErrors, [field]: err };
			});
			return;
		}

		try {
			await createGoal(formData);
			open = false;
			await loadGoals();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create goal';
		}
	}

	onMount(loadGoals);
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50">
	<!-- Professional Header Section -->
	<div class="relative overflow-hidden">
		<!-- Background Pattern -->
		<div class="absolute inset-0 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-700"></div>
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
									d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
								/>
							</svg>
						</div>
						<div>
							<h1 class="text-3xl font-bold text-white sm:text-4xl">Financial Goals</h1>
							<p class="mt-1 text-base text-teal-100 opacity-90 sm:text-lg">
								Track and achieve your family's financial objectives
							</p>
						</div>
					</div>
				</div>

				<div class="flex-shrink-0">
					<div class="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
						<Button on:click={openModal} disabled={!isOnline} class="w-full">
							{isOnline ? 'Add Goal' : 'Offline - Connect to Add'}
						</Button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Content Section -->
	<div class="relative">
		<div class="container mx-auto space-y-6 px-4 py-8 pb-12 sm:px-6 lg:px-8">
			{#if error}
				<div class="rounded-lg bg-red-50 p-4 text-sm text-red-700">
					{error}
				</div>
			{/if}

			{#if loading}
				<div class="flex h-64 items-center justify-center">
					<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
					<span class="ml-2 text-gray-600">Loading goals...</span>
				</div>
			{:else}
				<!-- Summary Cards -->
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card class="p-4">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-gray-600">Total Goals</p>
								<p class="text-2xl font-bold text-blue-600">{goals.length}</p>
							</div>
							<div class="rounded-full bg-blue-100 p-3">
								<svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
									/>
								</svg>
							</div>
						</div>
					</Card>

					<Card class="p-4">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-gray-600">Completed</p>
								<p class="text-2xl font-bold text-green-600">
									{goals.filter(g => g.is_completed).length}
								</p>
							</div>
							<div class="rounded-full bg-green-100 p-3">
								<svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
									/>
								</svg>
							</div>
						</div>
					</Card>

					<Card class="p-4">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-gray-600">Total Target</p>
								<p class="text-2xl font-bold text-purple-600">
									{formatCurrency(goals.reduce((sum, g) => sum + g.target_amount, 0))}
								</p>
							</div>
							<div class="rounded-full bg-purple-100 p-3">
								<svg class="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
									/>
								</svg>
							</div>
						</div>
					</Card>

					<Card class="p-4">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-gray-600">Average Progress</p>
								<p class="text-2xl font-bold text-amber-600">
									{goals.length > 0 ? ((goals.reduce((sum, g) => sum + (g.current_amount / g.target_amount * 100), 0) / goals.length).toFixed(1) + '%') : '0%'}
								</p>
							</div>
							<div class="rounded-full bg-amber-100 p-3">
								<svg class="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 6v6m0 0v6m0-6h6m-6 0H6"
									/>
								</svg>
							</div>
						</div>
					</Card>
				</div>

				{#if goals.length === 0}
					<div class="rounded-lg border border-dashed border-gray-300 p-12 text-center">
						<h3 class="mb-2 text-lg font-medium text-gray-900">No goals yet</h3>
						<p class="mb-4 text-gray-600">Start by creating your first financial goal</p>
						<Button on:click={openModal}>Create Goal</Button>
					</div>
				{:else}
					<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{#each goals as goal (goal.id)}
							<Card class="p-6">
								<div class="space-y-4">
									<div class="flex items-start justify-between">
										<div>
											<h3 class="font-semibold text-gray-900">{goal.name}</h3>
											<p class="text-sm text-gray-600 capitalize">{goal.type.replace('_', ' ')}</p>
										</div>
										<span class="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
											{formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
										</span>
									</div>

									<BudgetProgressBar
										budgeted={goal.target_amount}
										spent={goal.current_amount}
										categoryName={goal.name}
										showPercentage={true}
										compact={false}
									/>

									{#if goal.target_date}
										<div class="flex items-center text-sm text-gray-600">
											<svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
											Target: {new Date(goal.target_date).toLocaleDateString()}
										</div>
									{/if}

									{#if goal.is_completed}
										<div class="rounded-full bg-green-100 px-3 py-1 text-center text-sm font-medium text-green-800">
											Completed!
										</div>
									{/if}
								</div>
							</Card>
						{/each}
					</div>
				{/if}
			{/if}

			<Modal {open} title="Create New Goal" on:close={() => (open = false)}>
				<div class="space-y-4">
					<div>
						<label for="name" class="mb-1 block text-sm font-medium text-gray-700">Goal Name</label>
						<Input
							id="name"
							placeholder="e.g., Emergency Fund"
							value={formData.name}
							on:input={(e) => handleInputEvent('name', e)}
						/>
						{#if formErrors.name}
							<p class="mt-1 text-sm text-red-600">{formErrors.name}</p>
						{/if}
					</div>

					<div>
						<label for="type" class="mb-1 block text-sm font-medium text-gray-700">Goal Type</label>
						<Select
							id="type"
							value={formData.type}
							on:change={(e) => handleSelectEvent('type', e)}
						>
							<option value="emergency_fund">Emergency Fund</option>
							<option value="sinking_fund">Sinking Fund</option>
							<option value="debt_payoff">Debt Payoff</option>
							<option value="savings_goal">Savings Goal</option>
						</Select>
					</div>

					<div>
						<label for="target_amount" class="mb-1 block text-sm font-medium text-gray-700">
							Target Amount
						</label>
						<Input
							id="target_amount"
							type="number"
							placeholder="0.00"
							step="0.01"
							value={formData.target_amount}
							on:input={(e) => handleInputEvent('target_amount', e)}
						/>
						{#if formErrors.target_amount}
							<p class="mt-1 text-sm text-red-600">{formErrors.target_amount}</p>
						{/if}
					</div>

					<div>
						<label for="target_date" class="mb-1 block text-sm font-medium text-gray-700">
							Target Date (Optional)
						</label>
						<Input
							id="target_date"
							type="date"
							value={formData.target_date}
							on:input={(e) => handleInputEvent('target_date', e)}
						/>
						{#if formErrors.target_date}
							<p class="mt-1 text-sm text-red-600">{formErrors.target_date}</p>
						{/if}
					</div>
				</div>

				<div slot="footer" class="flex justify-end gap-3">
					<Button variant="outline" on:click={() => (open = false)}>Cancel</Button>
					<Button on:click={addGoal}>Create Goal</Button>
				</div>
			</Modal>
		</div>
	</div>
</div>

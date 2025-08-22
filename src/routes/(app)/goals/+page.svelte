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

	function handleInputChange(field: string, value: string) {
		formData = { ...formData, [field]: value };
		if (formErrors[field]) {
			formErrors = { ...formErrors, [field]: '' };
		}
	}

	function handleInputEvent(field: string, e: Event) {
		const input = e.target as HTMLInputElement;
		handleInputChange(field, input.value);
	}

	function handleSelectEvent(field: string, e: Event) {
		const select = e.target as HTMLSelectElement;
		handleInputChange(field, select.value);
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

<div class="container mx-auto px-4 py-6">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-800">Financial Goals</h1>
		<Button on:click={openModal} disabled={!isOnline}>
			{isOnline ? 'Add Goal' : 'Offline - Connect to Add'}
		</Button>
	</div>

	{#if error}
		<div class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
			{error}
		</div>
	{/if}

	{#if loading}
		<div class="flex justify-center py-12">
			<div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
		</div>
	{:else if goals.length === 0}
		<div class="rounded-lg border border-dashed border-gray-300 p-12 text-center">
			<h3 class="mb-2 text-lg font-medium text-gray-800">No goals yet</h3>
			<p class="mb-4 text-gray-600">Start by creating your first financial goal</p>
			<Button on:click={openModal}>Create Goal</Button>
		</div>
	{:else}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each goals as goal (goal.id)}
				<Card>
					<div class="space-y-4">
						<div class="flex items-start justify-between">
							<div>
								<h3 class="font-semibold text-gray-800">{goal.name}</h3>
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

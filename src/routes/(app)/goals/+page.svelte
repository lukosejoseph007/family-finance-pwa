<script lang="ts">
	import { Card, Button } from '$lib/components';

	let loading = $state(false);
	let goals = $state([]);

	// Placeholder for future goals functionality
	function createGoal() {
		// TODO: Implement goal creation
		console.log('Goal creation not yet implemented');
	}
</script>

<svelte:head>
	<title>Financial Goals - Family Finance Tracker</title>
</svelte:head>

<div class="container mx-auto space-y-6 px-4 py-6">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Financial Goals</h1>
			<p class="mt-1 text-gray-600">Track your family's financial objectives and progress</p>
		</div>

		<Button on:click={createGoal}>Add New Goal</Button>
	</div>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		<!-- Goals will be displayed here -->
		<Card class="p-6 text-center">
			<div class="mb-4 text-6xl">🎯</div>
			<h3 class="mb-2 text-lg font-semibold text-gray-900">No Goals Yet</h3>
			<p class="mb-4 text-gray-600">Start by creating your first financial goal</p>
			<Button variant="outline" on:click={createGoal}>Create Your First Goal</Button>
		</Card>
	</div>
</div>

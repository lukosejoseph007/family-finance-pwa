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

<div class="container mx-auto px-4 py-6 space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Financial Goals</h1>
			<p class="text-gray-600 mt-1">Track your family's financial objectives and progress</p>
		</div>
		
		<Button on:click={createGoal}>
			Add New Goal
		</Button>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		<!-- Goals will be displayed here -->
		<Card class="p-6 text-center">
			<div class="text-6xl mb-4">🎯</div>
			<h3 class="text-lg font-semibold text-gray-900 mb-2">No Goals Yet</h3>
			<p class="text-gray-600 mb-4">Start by creating your first financial goal</p>
			<Button variant="outline" on:click={createGoal}>
				Create Your First Goal
			</Button>
		</Card>
	</div>
</div>
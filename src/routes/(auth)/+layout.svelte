<script lang="ts">
	import { goto } from '$app/navigation';
	import { user } from '$lib/store';

	let { data, children } = $props();

	// Redirect to dashboard if already logged in
	$effect(() => {
		if (data.session?.user) {
			goto('/dashboard');
		}
	});
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<div class="text-center">
			<h1 class="text-3xl font-bold text-gray-900">Family Finance</h1>
			<p class="mt-2 text-sm text-gray-600">Track your family's finances with YNAB methodology</p>
		</div>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
			{@render children?.()}
		</div>
	</div>
</div>
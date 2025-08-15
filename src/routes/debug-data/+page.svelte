<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';
	import { getAccounts } from '$lib/services/accountService';
	import { getCategories } from '$lib/services/categoryService';

	let debugInfo = $state({
		authUser: null as any,
		userRecord: null as any,
		rawAccounts: null as any,
		rawCategories: null as any,
		serviceAccounts: null as any,
		serviceCategories: null as any,
		errors: [] as string[]
	});

	onMount(async () => {
		try {
			// Check auth
			const { data: authUser, error: authError } = await supabase.auth.getUser();
			debugInfo.authUser = authUser.user;
			if (authError) debugInfo.errors.push(`Auth error: ${authError.message}`);

			if (authUser.user) {
				// Check user record
				const { data: userRecord, error: userError } = await supabase
					.from('users')
					.select('*')
					.eq('id', authUser.user.id)
					.single();
				debugInfo.userRecord = userRecord;
				if (userError) debugInfo.errors.push(`User error: ${userError.message}`);

				// Check raw accounts data
				const { data: rawAccounts, error: accountError } = await supabase
					.from('accounts')
					.select('*');
				debugInfo.rawAccounts = rawAccounts;
				if (accountError) debugInfo.errors.push(`Raw accounts error: ${accountError.message}`);

				// Check raw categories data
				const { data: rawCategories, error: categoryError } = await supabase
					.from('categories')
					.select('*');
				debugInfo.rawCategories = rawCategories;
				if (categoryError) debugInfo.errors.push(`Raw categories error: ${categoryError.message}`);

				// Test service functions
				try {
					debugInfo.serviceAccounts = await getAccounts();
				} catch (err: any) {
					debugInfo.errors.push(`Service accounts error: ${err.message}`);
				}

				try {
					debugInfo.serviceCategories = await getCategories();
				} catch (err: any) {
					debugInfo.errors.push(`Service categories error: ${err.message}`);
				}
			}
		} catch (err: any) {
			debugInfo.errors.push(`General error: ${err.message}`);
		}
	});
</script>

<svelte:head>
	<title>Debug Data - Family Finance</title>
</svelte:head>

<div class="p-6 space-y-6">
	<h1 class="text-2xl font-bold">Debug Data Information</h1>

	<!-- Errors -->
	{#if debugInfo.errors.length > 0}
		<div class="bg-red-50 border border-red-200 rounded p-4">
			<h2 class="font-semibold text-red-800 mb-2">Errors:</h2>
			{#each debugInfo.errors as error}
				<div class="text-red-700 text-sm">{error}</div>
			{/each}
		</div>
	{/if}

	<!-- Auth User -->
	<div class="bg-blue-50 border border-blue-200 rounded p-4">
		<h2 class="font-semibold text-blue-800 mb-2">Auth User:</h2>
		<pre class="text-xs text-blue-700 overflow-auto">{JSON.stringify(debugInfo.authUser, null, 2)}</pre>
	</div>

	<!-- User Record -->
	<div class="bg-green-50 border border-green-200 rounded p-4">
		<h2 class="font-semibold text-green-800 mb-2">User Record:</h2>
		<pre class="text-xs text-green-700 overflow-auto">{JSON.stringify(debugInfo.userRecord, null, 2)}</pre>
	</div>

	<!-- Raw Accounts -->
	<div class="bg-yellow-50 border border-yellow-200 rounded p-4">
		<h2 class="font-semibold text-yellow-800 mb-2">Raw Accounts ({debugInfo.rawAccounts?.length || 0}):</h2>
		<pre class="text-xs text-yellow-700 overflow-auto max-h-40">{JSON.stringify(debugInfo.rawAccounts, null, 2)}</pre>
	</div>

	<!-- Raw Categories -->
	<div class="bg-purple-50 border border-purple-200 rounded p-4">
		<h2 class="font-semibold text-purple-800 mb-2">Raw Categories ({debugInfo.rawCategories?.length || 0}):</h2>
		<pre class="text-xs text-purple-700 overflow-auto max-h-40">{JSON.stringify(debugInfo.rawCategories, null, 2)}</pre>
	</div>

	<!-- Service Accounts -->
	<div class="bg-indigo-50 border border-indigo-200 rounded p-4">
		<h2 class="font-semibold text-indigo-800 mb-2">Service Accounts ({debugInfo.serviceAccounts?.length || 0}):</h2>
		<pre class="text-xs text-indigo-700 overflow-auto max-h-40">{JSON.stringify(debugInfo.serviceAccounts, null, 2)}</pre>
	</div>

	<!-- Service Categories -->
	<div class="bg-pink-50 border border-pink-200 rounded p-4">
		<h2 class="font-semibold text-pink-800 mb-2">Service Categories ({debugInfo.serviceCategories?.length || 0}):</h2>
		<pre class="text-xs text-pink-700 overflow-auto max-h-40">{JSON.stringify(debugInfo.serviceCategories, null, 2)}</pre>
	</div>
</div>
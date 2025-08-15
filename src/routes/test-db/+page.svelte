<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';

	let testResults: string[] = [];
	let isLoading = false;
	let hasError = false;

	async function testDatabaseConnection() {
		console.log('🚀 Starting database connection test...');
		isLoading = true;
		hasError = false;
		testResults = ['🔍 Starting database connection test...'];

		try {
			// Test 1: Check Supabase client
			testResults = [...testResults, '📡 Testing Supabase client connection...'];
			console.log('Testing Supabase client:', supabase);

			if (!supabase) {
				throw new Error('Supabase client is not initialized');
			}

			testResults = [...testResults, '✅ Supabase client initialized'];

			// Test 2: Try to read from families table
			testResults = [...testResults, '📋 Testing families table access...'];
			console.log('Testing families table...');

			const { data: families, error: familiesError } = await supabase
				.from('families')
				.select('*')
				.limit(1);

			console.log('Families result:', { data: families, error: familiesError });

			if (familiesError) {
				testResults = [...testResults, `❌ Families table error: ${familiesError.message}`];
				if (familiesError.code) {
					testResults = [...testResults, `   Error code: ${familiesError.code}`];
				}
			} else {
				testResults = [
					...testResults,
					`✅ Families table accessible (${families?.length || 0} records)`
				];
			}

			// Test 3: Try to read from users table
			testResults = [...testResults, '👥 Testing users table access...'];
			console.log('Testing users table...');

			const { data: users, error: usersError } = await supabase.from('users').select('*').limit(1);

			console.log('Users result:', { data: users, error: usersError });

			if (usersError) {
				testResults = [...testResults, `❌ Users table error: ${usersError.message}`];
				if (usersError.code) {
					testResults = [...testResults, `   Error code: ${usersError.code}`];
				}
			} else {
				testResults = [...testResults, `✅ Users table accessible (${users?.length || 0} records)`];
			}

			// Test 4: Check authentication status
			testResults = [...testResults, '🔐 Testing authentication status...'];
			console.log('Testing auth status...');

			const { data: authData, error: authError } = await supabase.auth.getUser();
			console.log('Auth result:', { data: authData, error: authError });

			if (authError) {
				testResults = [...testResults, `⚠️ Auth status: Error (${authError.message})`];
			} else if (authData.user) {
				testResults = [...testResults, `✅ Auth status: Authenticated as ${authData.user.email}`];
			} else {
				testResults = [...testResults, `⚠️ Auth status: Not authenticated (anonymous access)`];
			}

			testResults = [...testResults, '🎉 Database testing complete!'];
		} catch (error: any) {
			console.error('Database test error:', error);
			testResults = [...testResults, `💥 Unexpected error: ${error.message || error}`];
			hasError = true;
		} finally {
			isLoading = false;
			console.log('Database test finished');
		}
	}

	onMount(async () => {
		console.log('Component mounted, starting test...');
		await testDatabaseConnection();
	});
</script>

<div class="container mx-auto p-8">
	<h1 class="mb-8 text-3xl font-bold">Database Connection Test</h1>

	<div class="rounded-lg bg-gray-100 p-6">
		<div class="mb-4 flex items-center gap-4">
			<h2 class="text-xl font-semibold">Test Results</h2>
			{#if isLoading}
				<div class="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
			{/if}
		</div>

		<div class="space-y-2 font-mono text-sm">
			{#each testResults as result}
				<div class="rounded border bg-white p-2">
					{result}
				</div>
			{/each}
		</div>

		{#if !isLoading}
			<button
				onclick={() => testDatabaseConnection()}
				class="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
			>
				Run Test Again
			</button>
		{/if}
	</div>

	<div class="mt-8">
		<a href="/" class="text-blue-600 hover:underline">← Back to Home</a>
	</div>
</div>

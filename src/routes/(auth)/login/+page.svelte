<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Input } from '$lib/components';
	import { signIn } from '$lib/supabaseClient';

	let email = '';
	let password = '';
	let loading = false;
	let error = '';

	async function handleLogin() {
		if (!email || !password) {
			error = 'Please fill in all fields';
			return;
		}

		loading = true;
		error = '';

		try {
			await signIn(email, password);
			goto('/dashboard');
		} catch (err: any) {
			error = err.message || 'Failed to sign in';
		} finally {
			loading = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleLogin();
		}
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-bold text-gray-900">Sign in to your account</h2>
		<p class="mt-2 text-sm text-gray-600">
			Or
			<a href="/signup" class="font-medium text-blue-600 hover:text-blue-500">
				create a new account
			</a>
		</p>
	</div>

	<form on:submit|preventDefault={handleLogin} class="space-y-6">
		{#if error}
			<div class="rounded-md bg-red-50 p-4">
				<div class="text-sm text-red-700">{error}</div>
			</div>
		{/if}

		<Input
			label="Email address"
			type="email"
			bind:value={email}
			placeholder="Enter your email"
			required
			autocomplete="email"
			on:keydown={handleKeydown}
		/>

		<Input
			label="Password"
			type="password"
			bind:value={password}
			placeholder="Enter your password"
			required
			autocomplete="current-password"
			on:keydown={handleKeydown}
		/>

		<div class="flex items-center justify-between">
			<div class="text-sm">
				<a href="/forgot-password" class="font-medium text-blue-600 hover:text-blue-500">
					Forgot your password?
				</a>
			</div>
		</div>

		<Button
			type="submit"
			fullWidth
			{loading}
			disabled={loading || !email || !password}
		>
			{loading ? 'Signing in...' : 'Sign in'}
		</Button>
	</form>

	<div class="mt-6">
		<div class="relative">
			<div class="absolute inset-0 flex items-center">
				<div class="w-full border-t border-gray-300" />
			</div>
			<div class="relative flex justify-center text-sm">
				<span class="px-2 bg-white text-gray-500">New to Family Finance?</span>
			</div>
		</div>

		<div class="mt-6">
			<Button variant="outline" fullWidth>
				<a href="/signup" class="w-full">Create your account</a>
			</Button>
		</div>
	</div>
</div>
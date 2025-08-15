<script lang="ts">
	import { goto } from '$app/navigation';
	import { signIn, signUp } from '$lib/supabaseClient';

	let email = '';
	let password = '';
	let isSigningIn = true;
	let error: string | null = null;
	let loading = false;

	async function handleSubmit() {
		if (!email || !password) {
			error = 'Please enter both email and password';
			return;
		}

		error = null;
		loading = true;
		console.log('Form submitted, loading...');

		try {
			if (isSigningIn) {
				console.log('Attempting to sign in...');
				await signIn(email, password);
				console.log('Sign in successful.');
			} else {
				console.log('Attempting to sign up...');
				await signUp(email, password);
				console.log('Sign up successful.');
			}
			console.log('Redirecting to dashboard...');
			goto('/dashboard');
		} catch (err: any) {
			console.error('Caught an error during auth:', err);
			error = err.message || 'An error occurred during authentication';
		} finally {
			loading = false;
			console.log('Finished auth process.');
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
	<div class="mb-4 w-full max-w-md rounded bg-white px-8 pt-6 pb-8 shadow-md">
		<h2 class="mb-4 text-center text-2xl font-bold">
			{isSigningIn ? 'Sign In' : 'Create Account'}
		</h2>
		<form on:submit|preventDefault={handleSubmit}>
			<div class="mb-4">
				<label class="mb-2 block font-bold text-gray-700" for="email"> Email </label>
				<input
					class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
					id="email"
					type="email"
					placeholder="Enter your email"
					bind:value={email}
				/>
			</div>
			<div class="mb-6">
				<label class="mb-2 block font-bold text-gray-700" for="password"> Password </label>
				<input
					class="focus:shadow-outline mb-3 w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
					id="password"
					type="password"
					placeholder="Enter your password"
					bind:value={password}
				/>
			</div>
			{#if error}
				<div
					class="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
					role="alert"
				>
					{error}
				</div>
			{/if}
			<div class="flex items-center justify-between">
				<button
					class="focus:shadow-outline rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 focus:outline-none disabled:bg-gray-400"
					type="submit"
					disabled={loading}
				>
					{loading ? 'Loading...' : isSigningIn ? 'Sign In' : 'Sign Up'}
				</button>
				<a
					href="#"
					class="inline-block align-baseline text-sm font-bold text-blue-500 hover:text-blue-800"
					on:click|preventDefault={() => (isSigningIn = !isSigningIn)}
				>
					{isSigningIn ? 'Create an account' : 'Sign in instead'}
				</a>
			</div>
		</form>
	</div>
</div>

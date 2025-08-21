<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button, Input } from '$lib/components';
	import { updatePassword } from '$lib/supabaseClient';

	let newPassword = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);

	onMount(() => {
		// Check if we have the reset token in the URL
		const hashParams = new URLSearchParams(window.location.hash.substring(1));
		const accessToken = hashParams.get('access_token');

		if (!accessToken) {
			error = 'Invalid reset link. Please request a new password reset.';
		}
	});

	async function handleUpdatePassword() {
		if (!newPassword || !confirmPassword) {
			error = 'Please fill in both password fields';
			return;
		}

		if (newPassword !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (newPassword.length < 6) {
			error = 'Password must be at least 6 characters';
			return;
		}

		loading = true;
		error = '';

		try {
			await updatePassword(newPassword);
			success = true;

			// Redirect to login after 3 seconds
			setTimeout(() => {
				goto('/login');
			}, 3000);
		} catch (err: any) {
			error = err.message || 'Failed to update password';
		} finally {
			loading = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleUpdatePassword();
		}
	}
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100"
>
	<div class="w-full max-w-md space-y-8 p-8">
		<div class="text-center">
			<h2 class="text-3xl font-extrabold text-gray-900">Set new password</h2>
			<p class="mt-2 text-sm text-gray-600">Enter your new password below.</p>
		</div>

		{#if success}
			<div class="rounded-md bg-green-50 p-4">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-green-800">Password updated successfully!</h3>
						<div class="mt-2 text-sm text-green-700">
							<p>Redirecting you to login...</p>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<form on:submit|preventDefault={handleUpdatePassword} class="space-y-6">
				{#if error}
					<div class="rounded-md bg-red-50 p-4">
						<div class="text-sm text-red-700">{error}</div>
					</div>
				{/if}

				<Input
					label="New Password"
					type="password"
					bind:value={newPassword}
					placeholder="Enter new password (min. 6 characters)"
					required
					autocomplete="new-password"
					on:keydown={handleKeydown}
					id="newPassword"
				/>

				<Input
					label="Confirm New Password"
					type="password"
					bind:value={confirmPassword}
					placeholder="Confirm new password"
					required
					autocomplete="new-password"
					on:keydown={handleKeydown}
					id="confirmPassword"
				/>

				<Button
					type="submit"
					fullWidth
					{loading}
					disabled={loading || !newPassword || !confirmPassword}
				>
					{loading ? 'Updating...' : 'Update password'}
				</Button>
			</form>
		{/if}

		<div class="text-center">
			<p class="text-sm text-gray-600">
				<a href="/login" class="font-medium text-blue-600 hover:text-blue-500"> Back to login </a>
			</p>
		</div>
	</div>
</div>

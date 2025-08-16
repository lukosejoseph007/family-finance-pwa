<script lang="ts">
	import { Button, Input } from '$lib/components';
	import { resetPassword } from '$lib/supabaseClient';

	let email = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);

	async function handleResetPassword() {
		if (!email) {
			error = 'Please enter your email address';
			return;
		}

		loading = true;
		error = '';

		try {
			await resetPassword(email);
			success = true;
		} catch (err: any) {
			error = err.message || 'Failed to send reset email';
		} finally {
			loading = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleResetPassword();
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
	<div class="max-w-md w-full space-y-8 p-8">
		<div class="text-center">
			<h2 class="text-3xl font-extrabold text-gray-900">
				Reset your password
			</h2>
			<p class="mt-2 text-sm text-gray-600">
				Enter your email address and we'll send you a link to reset your password.
			</p>
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
						<h3 class="text-sm font-medium text-green-800">Reset email sent!</h3>
						<div class="mt-2 text-sm text-green-700">
							<p>
								Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
							</p>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<form on:submit|preventDefault={handleResetPassword} class="space-y-6">
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
					id="email"
				/>

				<Button
					type="submit"
					fullWidth
					{loading}
					disabled={loading || !email}
				>
					{loading ? 'Sending...' : 'Send reset email'}
				</Button>
			</form>
		{/if}

		<div class="text-center">
			<p class="text-sm text-gray-600">
				Remember your password?
				<a href="/login" class="font-medium text-blue-600 hover:text-blue-500">
					Sign in here
				</a>
			</p>
		</div>
	</div>
</div>
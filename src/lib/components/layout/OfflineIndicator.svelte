<script lang="ts">
	import { offlineStore } from '$lib/stores/offline';
	import { Badge, Button } from '$lib/components';
	import { onMount } from 'svelte';
	import { isPWA } from '$lib/pwa';

	let showDetails = $state(false);
	let showConnectedToast = $state(false);
	let wasOffline = $state(false);

	function toggleDetails() {
		showDetails = !showDetails;
	}

	function handleRetry() {
		// In PWA mode, avoid full page reload to prevent refresh loops
		if (isPWA()) {
			console.log('🔄 PWA mode: Retrying connection without reload...');
			// Just retry the network check without reload
			window.dispatchEvent(new Event('online'));
		} else {
			window.location.reload();
		}
	}

	// Track online/offline transitions and manage toast visibility
	$effect(() => {
		if (!$offlineStore.isOnline) {
			// When going offline
			wasOffline = true;
			showConnectedToast = false;
		} else if ($offlineStore.isOnline && wasOffline) {
			// When coming back online after being offline
			showConnectedToast = true;
			wasOffline = false;

			// Hide the connected toast after 3 seconds
			setTimeout(() => {
				showConnectedToast = false;
			}, 3000);
		}

		// Auto-hide detailed modal after going back online
		if ($offlineStore.isOnline && showDetails) {
			setTimeout(() => {
				showDetails = false;
			}, 3000);
		}
	});
</script>

<!-- Offline Badge (always visible when offline) -->
{#if !$offlineStore.isOnline}
	<div class="fixed top-4 right-4 z-50">
		<button
			onclick={toggleDetails}
			class="flex items-center space-x-2 rounded-lg bg-red-500 px-3 py-2 text-white shadow-lg transition-colors hover:bg-red-600"
			aria-label="Offline status"
		>
			<div class="h-2 w-2 animate-pulse rounded-full bg-white"></div>
			<span class="text-sm font-medium">Offline</span>
		</button>
	</div>
{/if}

<!-- Detailed Offline Panel -->
{#if showDetails}
	<div class="bg-opacity-50 fixed inset-0 z-40 flex items-center justify-center bg-black p-4">
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold text-gray-900">
					{$offlineStore.isOnline ? 'Back Online!' : "You're Offline"}
				</h3>
				<button
					onclick={toggleDetails}
					class="text-gray-400 hover:text-gray-600"
					aria-label="Close"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			{#if $offlineStore.isOnline}
				<div class="text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
					>
						<svg
							class="h-8 w-8 text-green-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
					<p class="mb-4 text-gray-600">
						Your connection has been restored. Any pending changes will sync automatically.
					</p>
					{#if $offlineStore.pendingSync}
						<div class="flex items-center justify-center space-x-2 text-blue-600">
							<div class="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
							<span class="text-sm">Syncing changes...</span>
						</div>
					{/if}
				</div>
			{:else}
				<div class="text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100"
					>
						<svg class="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728"
							/>
						</svg>
					</div>
					<p class="mb-4 text-gray-600">
						No internet connection detected. You can still view your data and make changes - they'll
						sync when you're back online.
					</p>

					<div class="space-y-3">
						<!-- Offline Capabilities -->
						<div class="rounded-lg bg-blue-50 p-3">
							<h4 class="mb-2 font-medium text-blue-900">What you can do offline:</h4>
							<ul class="space-y-1 text-left text-sm text-blue-800">
								<li>• View your dashboard and financial data</li>
								<li>• Add new transactions and categories</li>
								<li>• Update budgets and goals</li>
								<li>• Browse reports and charts</li>
							</ul>
						</div>

						<!-- Service Worker Status -->
						<div class="flex items-center justify-between text-sm">
							<span class="text-gray-600">Offline Mode:</span>
							<Badge variant={$offlineStore.hasServiceWorker ? 'success' : 'warning'}>
								{$offlineStore.hasServiceWorker ? 'Active' : 'Limited'}
							</Badge>
						</div>

						{#if $offlineStore.lastSync}
							<div class="text-xs text-gray-500">
								Last sync: {$offlineStore.lastSync.toLocaleString()}
							</div>
						{/if}

						<!-- Actions -->
						<div class="flex space-x-2 pt-2">
							<Button variant="outline" size="sm" on:click={handleRetry} class="flex-1">
								Retry Connection
							</Button>
							<Button size="sm" on:click={toggleDetails} class="flex-1">Continue Offline</Button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Connection Toast (brief notification - only when transitioning from offline to online) -->
{#if showConnectedToast}
	<div class="fixed right-4 bottom-4 z-50">
		<div
			class="flex animate-bounce items-center space-x-2 rounded-lg bg-green-500 px-4 py-2 text-white shadow-lg"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
				/>
			</svg>
			<span class="text-sm font-medium">Connected</span>
		</div>
	</div>
{/if}

<script lang="ts">
	import { offlineStore } from '$lib/stores/offline';
	import { Badge, Button } from '$lib/components';
	import { onMount } from 'svelte';

	let showDetails = $state(false);
	let showConnectedToast = $state(false);
	let wasOffline = $state(false);

	function toggleDetails() {
		showDetails = !showDetails;
	}

	function handleRetry() {
		window.location.reload();
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
			class="flex items-center space-x-2 bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-red-600 transition-colors"
			aria-label="Offline status"
		>
			<div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
			<span class="text-sm font-medium">Offline</span>
		</button>
	</div>
{/if}

<!-- Detailed Offline Panel -->
{#if showDetails}
	<div class="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-semibold text-gray-900">
					{$offlineStore.isOnline ? 'Back Online!' : 'You\'re Offline'}
				</h3>
				<button 
					onclick={toggleDetails}
					class="text-gray-400 hover:text-gray-600"
					aria-label="Close"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			{#if $offlineStore.isOnline}
				<div class="text-center">
					<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<p class="text-gray-600 mb-4">
						Your connection has been restored. Any pending changes will sync automatically.
					</p>
					{#if $offlineStore.pendingSync}
						<div class="flex items-center justify-center space-x-2 text-blue-600">
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
							<span class="text-sm">Syncing changes...</span>
						</div>
					{/if}
				</div>
			{:else}
				<div class="text-center">
					<div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
						</svg>
					</div>
					<p class="text-gray-600 mb-4">
						No internet connection detected. You can still view your data and make changes - they'll sync when you're back online.
					</p>
					
					<div class="space-y-3">
						<!-- Offline Capabilities -->
						<div class="bg-blue-50 rounded-lg p-3">
							<h4 class="font-medium text-blue-900 mb-2">What you can do offline:</h4>
							<ul class="text-sm text-blue-800 space-y-1 text-left">
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
							<Button size="sm" on:click={toggleDetails} class="flex-1">
								Continue Offline
							</Button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Connection Toast (brief notification - only when transitioning from offline to online) -->
{#if showConnectedToast}
	<div class="fixed bottom-4 right-4 z-50">
		<div class="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-bounce">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
			</svg>
			<span class="text-sm font-medium">Connected</span>
		</div>
	</div>
{/if}
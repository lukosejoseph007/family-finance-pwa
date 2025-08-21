<script lang="ts">
	import { onMount } from 'svelte';
	import { offlineStore } from '$lib/stores/offline';
	import { pwaService } from '$lib/services/pwaService';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	let serviceWorkerStatus = $state('Checking...');
	let updateAvailable = $state(false);
	let syncStatus = $state('No pending sync');

	onMount(() => {
		// Check initial service worker status
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.ready.then((registration) => {
				serviceWorkerStatus = registration.active ? 'Active' : 'Inactive';
			});
		} else {
			serviceWorkerStatus = 'Not supported';
		}
	});

	async function checkForUpdates() {
		try {
			await pwaService.checkForUpdates();
			updateAvailable = true;
		} catch (error) {
			console.log('No updates available');
			updateAvailable = false;
		}
	}

	async function forceUpdate() {
		try {
			await pwaService.reloadApp();
		} catch (error) {
			window.location.reload();
		}
	}

	function testOfflineSync() {
		// Simulate some offline data
		pwaService.syncPendingData();
		syncStatus = 'Sync triggered';
		setTimeout(() => {
			syncStatus = 'Sync completed';
		}, 2000);
	}

	function simulateOffline() {
		offlineStore.setOnline(false);
		setTimeout(() => {
			offlineStore.setOnline(true);
		}, 3000);
	}
</script>

<div class="container mx-auto space-y-6 p-6">
	<h1 class="text-3xl font-bold text-gray-900">PWA Test Page</h1>

	<div class="grid gap-6 md:grid-cols-2">
		<!-- Service Worker Status -->
		<Card>
			<div class="p-6">
				<h2 class="mb-4 text-xl font-semibold">Service Worker Status</h2>
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<span>Status:</span>
						<span class="rounded bg-gray-100 px-2 py-1 font-mono text-sm">
							{serviceWorkerStatus}
						</span>
					</div>
					<div class="flex items-center justify-between">
						<span>Online:</span>
						<span
							class="rounded px-2 py-1 font-mono text-sm"
							class:bg-green-100={$offlineStore.isOnline}
							class:bg-red-100={!$offlineStore.isOnline}
						>
							{$offlineStore.isOnline ? 'Yes' : 'No'}
						</span>
					</div>
					<div class="flex items-center justify-between">
						<span>SW Registered:</span>
						<span
							class="rounded px-2 py-1 font-mono text-sm"
							class:bg-green-100={serviceWorkerStatus === 'Active'}
							class:bg-red-100={serviceWorkerStatus !== 'Active'}
						>
							{serviceWorkerStatus === 'Active' ? 'Yes' : 'No'}
						</span>
					</div>
				</div>
			</div>
		</Card>

		<!-- Update Management -->
		<Card>
			<div class="p-6">
				<h2 class="mb-4 text-xl font-semibold">App Updates</h2>
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<span>Update Available:</span>
						<span
							class="rounded px-2 py-1 font-mono text-sm"
							class:bg-yellow-100={updateAvailable}
							class:bg-gray-100={!updateAvailable}
						>
							{updateAvailable ? 'Yes' : 'No'}
						</span>
					</div>
					<div class="space-y-2">
						<Button on:click={checkForUpdates} variant="outline" class="w-full">
							Check for Updates
						</Button>
						{#if updateAvailable}
							<Button on:click={forceUpdate} variant="primary" class="w-full">Update Now</Button>
						{/if}
					</div>
				</div>
			</div>
		</Card>

		<!-- Offline Capabilities -->
		<Card>
			<div class="p-6">
				<h2 class="mb-4 text-xl font-semibold">Offline Features</h2>
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<span>Sync Status:</span>
						<span class="rounded bg-gray-100 px-2 py-1 font-mono text-sm">
							{syncStatus}
						</span>
					</div>
					<div class="space-y-2">
						<Button on:click={testOfflineSync} variant="outline" class="w-full">Test Sync</Button>
						<Button on:click={simulateOffline} variant="outline" class="w-full">
							Simulate Offline (3s)
						</Button>
					</div>
				</div>
			</div>
		</Card>

		<!-- PWA Installation -->
		<Card>
			<div class="p-6">
				<h2 class="mb-4 text-xl font-semibold">PWA Installation</h2>
				<div class="space-y-3">
					<p class="text-sm text-gray-600">
						This app can be installed on your device for a native app-like experience.
					</p>
					<div class="space-y-2">
						<Button variant="primary" class="w-full">Install App</Button>
						<p class="text-center text-xs text-gray-500">
							Installation prompt will appear automatically when available
						</p>
					</div>
				</div>
			</div>
		</Card>
	</div>

	<!-- Cache Information -->
	<Card>
		<div class="p-6">
			<h2 class="mb-4 text-xl font-semibold">Cache Information</h2>
			<div class="grid gap-4 md:grid-cols-3">
				<div class="rounded bg-gray-50 p-4 text-center">
					<div class="text-2xl font-bold text-blue-600">Pages</div>
					<div class="text-sm text-gray-600">Cached for offline use</div>
				</div>
				<div class="rounded bg-gray-50 p-4 text-center">
					<div class="text-2xl font-bold text-green-600">Assets</div>
					<div class="text-sm text-gray-600">Images, CSS, JS cached</div>
				</div>
				<div class="rounded bg-gray-50 p-4 text-center">
					<div class="text-2xl font-bold text-purple-600">Data</div>
					<div class="text-sm text-gray-600">API responses cached</div>
				</div>
			</div>
		</div>
	</Card>

	<!-- Instructions -->
	<Card>
		<div class="p-6">
			<h2 class="mb-4 text-xl font-semibold">Testing Instructions</h2>
			<div class="prose text-sm">
				<ol class="space-y-2">
					<li>Check that the Service Worker status shows "Active"</li>
					<li>Test the "Simulate Offline" button to see offline indicator</li>
					<li>Try navigating between pages while offline</li>
					<li>Check for updates to test the update mechanism</li>
					<li>Open browser dev tools → Application → Service Workers for detailed info</li>
				</ol>
			</div>
		</div>
	</Card>
</div>

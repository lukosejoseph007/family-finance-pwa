<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { user } from '$lib/store';
	import { Sidebar, OfflineIndicator } from '$lib/components';
	import { pwaService } from '$lib/services/pwaService';
	import { offlineStore } from '$lib/stores/offline';

	let { data, children } = $props();

	// Keep the user store in sync with the server session
	if (data.session?.user) {
		user.set(data.session.user);
	}

	let sidebarOpen = $state(false);

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	// Context-aware FAB configuration
	const fabConfigs: Record<string, { icon: string; label: string; href?: string; action?: string; show: boolean }> = {
		'/dashboard': { icon: 'plus', label: 'Add Transaction', action: 'modal', show: true },
		'/transactions': { icon: 'plus', label: 'Add Transaction', action: 'modal', show: false }, // Header has add button
		'/accounts': { icon: 'plus', label: 'Add Account', action: 'modal', show: false }, // Header has add button
		'/categories': { icon: 'plus', label: 'Add Category', action: 'modal', show: false }, // Header has add button
		'/budget': { icon: 'edit', label: 'Quick Edit', action: 'modal', show: true },
		'/goals': { icon: 'plus', label: 'Add Goal', action: 'modal', show: true },
		'/reports': { icon: 'download', label: 'Export Report', action: 'download', show: true }
	};

	// Get current FAB config based on route using Svelte 5 derived
	let currentPath = $derived($page.url.pathname);
	let fabConfig = $derived(fabConfigs[currentPath] || { icon: 'plus', label: 'Add', show: false });

	function handleFabClick() {
		const config = fabConfigs[currentPath];
		if (!config) return;

		if (config.href) {
			// Navigate to specified URL
			window.location.href = config.href;
		} else if (config.action === 'modal') {
			// Dispatch custom event for the page to handle
			window.dispatchEvent(new CustomEvent('fab-click', {
				detail: { page: currentPath, action: config.action }
			}));
		}
	}

	// Initialize PWA functionality
	onMount(() => {
		// Initialize service worker asynchronously
		pwaService.init();

		// Set up online/offline listeners
		function handleOnline() {
			offlineStore.setOnline(true);
			// Sync pending data when coming back online
			pwaService.syncPendingData();
		}

		function handleOffline() {
			offlineStore.setOnline(false);
		}

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		// Check for updates periodically (every 30 minutes)
		const updateInterval = setInterval(() => {
			pwaService.checkForUpdates();
		}, 30 * 60 * 1000);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
			clearInterval(updateInterval);
		};
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 flex overflow-x-hidden pb-[env(safe-area-inset-bottom)]">
	<!-- Sidebar -->
	<Sidebar {data} bind:sidebarOpen />

	<!-- Main content area -->
	<div class="flex-1 flex flex-col lg:ml-0 min-w-0 overflow-x-hidden">
		<!-- Mobile header with glassmorphism -->
		<header class="lg:hidden bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-30 shadow-lg shadow-black/5">
			<div class="flex items-center justify-between h-16 px-4">
				<button
					onclick={toggleSidebar}
					class="p-2.5 rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 text-gray-600 hover:text-gray-900 hover:bg-white/80 transition-all duration-200 shadow-sm"
					aria-label="Open menu"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
				
				<div class="flex items-center space-x-3">
					<div class="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/25">
						<span class="text-white text-lg font-bold">₹</span>
					</div>
					<div class="text-center">
						<h1 class="text-xl font-bold text-gray-900">Family Finance</h1>
						<p class="text-sm text-gray-500 -mt-1">YNAB for Indian Families</p>
					</div>
				</div>
				
				<div class="w-10"></div> <!-- Spacer for centering -->
			</div>
		</header>

		<!-- Main Content -->
		<main class="flex-1 sm:p-6 lg:p-8 pb-20 sm:pb-24 overflow-x-hidden overflow-y-auto">
			{@render children?.()}
		</main>

		<!-- Footer with Glassmorphism -->
		<footer class="bg-white/60 backdrop-blur-xl border-t border-white/30 mt-auto shadow-lg shadow-black/5">
			<div class="px-4 lg:px-8 py-4">
				<div class="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
					<p class="text-base text-gray-600 text-center sm:text-left">
						© 2024 Family Finance. Built with YNAB methodology for Indian families.
					</p>
					<div class="flex space-x-4 text-base">
						<a href="/reports" class="text-gray-500 hover:text-blue-600 transition-colors">Reports</a>
						<a href="/settings" class="text-gray-500 hover:text-blue-600 transition-colors">Settings</a>
						<a href="/goals" class="text-gray-500 hover:text-blue-600 transition-colors">Goals</a>
					</div>
				</div>
			</div>
		</footer>
	</div>

	<!-- Context-Aware Floating Action Button with Glassmorphism -->
	{#if fabConfig.show}
		<div class="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
			<div class="flex flex-col items-end space-y-2">
				<!-- FAB Label (appears on hover) -->
				<div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/80 backdrop-blur-sm text-white text-sm py-2 px-3 rounded-xl whitespace-nowrap shadow-lg shadow-black/25">
					{fabConfig.label}
				</div>
				
				<!-- Main FAB Button with Glassmorphism -->
				<button
					onclick={handleFabClick}
					class="group bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/40 transform transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-sm border border-white/20"
					aria-label={fabConfig.label}
					title={fabConfig.label}
				>
					{#if fabConfig.icon === 'plus'}
						<svg class="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
						</svg>
					{:else if fabConfig.icon === 'edit'}
						<svg class="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
						</svg>
					{:else if fabConfig.icon === 'download'}
						<svg class="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
					{/if}
				</button>
			</div>
		</div>
	{/if}

	<!-- Offline Indicator (global) -->
	<OfflineIndicator />
</div>
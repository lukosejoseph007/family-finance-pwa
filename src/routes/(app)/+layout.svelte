<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { user } from '$lib/store';
	import { Sidebar, OfflineIndicator } from '$lib/components';
	import { pwaService } from '$lib/services/pwaService';
	import { offlineStore } from '$lib/stores/offline';
	import { setupPWAFixes, isPWA } from '$lib/pwa.js';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';

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
	const fabConfigs: Record<
		string,
		{ icon: string; label: string; href?: string; action?: string; show: boolean }
	> = {
		'/dashboard': { icon: 'plus', label: 'Add Transaction', action: 'modal', show: true },
		'/transactions': { icon: 'plus', label: 'Add Transaction', action: 'modal', show: false },
		'/accounts': { icon: 'plus', label: 'Add Account', action: 'modal', show: false },
		'/categories': { icon: 'plus', label: 'Add Category', action: 'modal', show: false },
		'/budget': { icon: 'edit', label: 'Quick Edit', action: 'modal', show: true },
		'/goals': { icon: 'plus', label: 'Add Goal', action: 'modal', show: true },
		'/reports': { icon: 'download', label: 'Export Report', action: 'download', show: true }
	};

	let currentPath = $derived($page.url.pathname);
	let fabConfig = $derived(fabConfigs[currentPath] || { icon: 'plus', label: 'Add', show: false });

	function handleFabClick() {
		const config = fabConfigs[currentPath];
		if (!config) return;

		if (config.href) {
			window.location.href = config.href;
		} else if (config.action === 'modal') {
			window.dispatchEvent(
				new CustomEvent('fab-click', {
					detail: { page: currentPath, action: config.action }
				})
			);
		}
	}

	onMount(() => {
		const checkOnboarding = async () => {
			if ($page.url.pathname === '/onboarding') return;

			const { data: { session } } = await supabase.auth.getSession();
			if (session) {
				const { data: userProfile, error } = await supabase
					.from('users')
					.select('family_id')
					.eq('id', session.user.id)
					.single();

				if (error && error.code !== 'PGRST116') {
					console.error('Error fetching user profile:', error);
					return;
				}

				if (!userProfile) {
					const { error: insertError } = await supabase.from('users').insert({
						id: session.user.id,
						email: session.user.email!,
						display_name:
							session.user.user_metadata?.display_name ||
							session.user.user_metadata?.full_name ||
							session.user.email?.split('@')[0]
					});
					if (insertError) {
						console.error('Failed to create user profile:', insertError);
					} else {
						goto('/onboarding');
					}
				} else if (!userProfile.family_id) {
					goto('/onboarding');
				}
			}
		};

		checkOnboarding();

		// === Initialize service worker ===
		pwaService.init();

		// === Setup online/offline listeners ===
		function handleOnline() {
			offlineStore.setOnline(true);
			pwaService.syncPendingData();
		}

		function handleOffline() {
			offlineStore.setOnline(false);
		}

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		// === Check for updates every 30 minutes ===
		const updateInterval = setInterval(() => {
			pwaService.checkForUpdates();
		}, 30 * 60 * 1000);

		// === Apply general PWA fixes ===
		setupPWAFixes();

		// === Optional: PWA-specific diagnostics and error logging ===
		if (isPWA()) {
			console.log('📱 App running in PWA mode');

			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.addEventListener('message', (event) => {
					if (event.data?.type === 'CACHE_CLEARED') {
						console.log('✅ Service Worker cache cleared');
					}
				});
			}

			window.addEventListener('error', (error) => {
				console.error('🚨 PWA Error:', error);
			});

			window.addEventListener('unhandledrejection', (event) => {
				console.error('🚨 PWA Unhandled Rejection:', event.reason);
			});
		}

		// === Cleanup on component destroy ===
		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
			clearInterval(updateInterval);
		};
	});
</script>

<div
	class="flex min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 pb-[env(safe-area-inset-bottom)]"
>
	<!-- Sidebar -->
	<Sidebar {data} bind:sidebarOpen />

	<!-- Main content area -->
	<div class="flex min-w-0 flex-1 flex-col overflow-x-hidden lg:ml-0">
		<!-- Mobile header with glassmorphism -->
		<header
			class="sticky top-0 z-30 border-b border-white/20 bg-white/80 shadow-lg shadow-black/5 backdrop-blur-xl lg:hidden"
		>
			<div class="flex h-16 items-center justify-between px-4">
				<button
					onclick={toggleSidebar}
					class="rounded-xl border border-white/30 bg-white/60 p-2.5 text-gray-600 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white/80 hover:text-gray-900"
					aria-label="Open menu"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				</button>

				<div class="flex items-center space-x-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25"
					>
						<span class="text-lg font-bold text-white">₹</span>
					</div>
					<div class="text-center">
						<h1 class="text-xl font-bold text-gray-900">Family Finance</h1>
						<p class="-mt-1 text-sm text-gray-500">Budgeting & Expense Tracker</p>
					</div>
				</div>

				<div class="w-10"></div>
				<!-- Spacer for centering -->
			</div>
		</header>

		<!-- Main Content -->
		<main class="flex-1 overflow-x-hidden overflow-y-auto pb-20 sm:p-6 sm:pb-24 lg:p-8">
			{@render children?.()}
		</main>

		<!-- Footer with Glassmorphism -->
		<footer
			class="mt-auto border-t border-white/30 bg-white/60 shadow-lg shadow-black/5 backdrop-blur-xl"
		>
			<div class="px-4 py-4 lg:px-8">
				<div class="flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0">
					<p class="text-center text-base text-gray-600 sm:text-left">
						© 2024 Family Finance. Built for family budgeting and expense tracking.
					</p>
					<div class="flex space-x-4 text-base">
						<a href="/reports" class="text-gray-500 transition-colors hover:text-blue-600"
							>Reports</a
						>
						<a href="/settings" class="text-gray-500 transition-colors hover:text-blue-600"
							>Settings</a
						>
						<a href="/goals" class="text-gray-500 transition-colors hover:text-blue-600">Goals</a>
					</div>
				</div>
			</div>
		</footer>
	</div>

	<!-- Context-Aware Floating Action Button with Glassmorphism -->
	{#if fabConfig.show}
		<div class="fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6">
			<div class="flex flex-col items-end space-y-2">
				<!-- FAB Label (appears on hover) -->
				<div
					class="rounded-xl bg-black/80 px-3 py-2 text-sm whitespace-nowrap text-white opacity-0 shadow-lg shadow-black/25 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100"
				>
					{fabConfig.label}
				</div>

				<!-- Main FAB Button with Glassmorphism -->
				<button
					onclick={handleFabClick}
					class="group flex h-14 w-14 transform items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/25 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:from-blue-600 hover:to-indigo-700 hover:shadow-2xl hover:shadow-blue-500/40 active:scale-95 sm:h-16 sm:w-16"
					aria-label={fabConfig.label}
					title={fabConfig.label}
				>
					{#if fabConfig.icon === 'plus'}
						<svg
							class="h-6 w-6 sm:h-8 sm:w-8"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6v6m0 0v6m0-6h6m-6 0H6"
							/>
						</svg>
					{:else if fabConfig.icon === 'edit'}
						<svg
							class="h-6 w-6 sm:h-8 sm:w-8"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/>
						</svg>
					{:else if fabConfig.icon === 'download'}
						<svg
							class="h-6 w-6 sm:h-8 sm:w-8"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					{/if}
				</button>
			</div>
		</div>
	{/if}

	<!-- Offline Indicator (global) -->
	<OfflineIndicator />
</div>

<style>
	/* Global PWA fixes */
	:global(body) {
		/* Prevent pull-to-refresh in PWA */
		overscroll-behavior-y: contain;
	}

	/* PWA-specific global styles */
	@media all and (display-mode: standalone) {
		:global(html) {
			overscroll-behavior: contain;
			-webkit-overflow-scrolling: touch;
		}

		:global(body) {
			/* Prevent bounce scrolling */
			overscroll-behavior: contain;
			-webkit-touch-callout: none;
			-webkit-user-select: none;
			user-select: none;
		}

		/* Allow text selection where appropriate */
		:global(input),
		:global(textarea),
		:global(.selectable) {
			-webkit-user-select: text;
			user-select: text;
		}

		/* Prevent zoom on input focus */
		:global(input),
		:global(select),
		:global(textarea) {
			font-size: 16px !important;
			touch-action: manipulation;
		}

		/* Prevent double-tap zoom on buttons */
		:global(button) {
			touch-action: manipulation;
		}

		/* Fix viewport issues */
		:global(.app-container) {
			padding-top: env(safe-area-inset-top);
			padding-bottom: env(safe-area-inset-bottom);
			padding-left: env(safe-area-inset-left);
			padding-right: env(safe-area-inset-right);
		}
	}
</style>
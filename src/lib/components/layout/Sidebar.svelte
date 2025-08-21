<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { signOut } from '$lib/supabaseClient';
	import { Button } from '$lib/components';
	import { getUserDisplayName, getUserInitials } from '$lib/utils/user';
	import type { AuthUser } from '$lib/types';

	let { data, sidebarOpen = $bindable(false) } = $props<{
		data: { session?: { user?: AuthUser } };
		sidebarOpen?: boolean;
	}>();

	// Navigation items
	const navigation = [
		{ name: 'Dashboard', href: '/dashboard', icon: '🏠' },
		{ name: 'Accounts', href: '/accounts', icon: '🏦' },
		{ name: 'Categories', href: '/categories', icon: '📋' },
		{ name: 'Transactions', href: '/transactions', icon: '💰' },
		{ name: 'Budget', href: '/budget', icon: '📊' },
		{ name: 'Goals', href: '/goals', icon: '🎯' },
		{ name: 'Reports', href: '/reports', icon: '📈' },
		{ name: 'Export', href: '/exports', icon: '📤' },
		{ name: 'Settings', href: '/settings', icon: '⚙️' }
	];

	const currentPath = $derived($page.url.pathname);

	async function handleSignOut() {
		try {
			await signOut();
			goto('/');
		} catch (error) {
			console.error('Error signing out:', error);
		}
	}

	function closeSidebar() {
		sidebarOpen = false;
	}
</script>

<!-- Mobile sidebar backdrop with glassmorphism -->
{#if sidebarOpen}
	<div
		class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
		onclick={closeSidebar}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && closeSidebar()}
	></div>
{/if}

<!-- Sidebar with Glassmorphism -->
<div
	class="fixed inset-y-0 left-0 z-50 w-72 transform border-r border-white/30 bg-white/70 shadow-2xl shadow-black/10 backdrop-blur-2xl transition-all duration-300 ease-in-out lg:w-80 xl:w-84
	{sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
	pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] lg:static lg:inset-0 lg:translate-x-0"
>
	<!-- Sidebar header with glassmorphism -->
	<div
		class="flex h-24 items-center justify-between border-b border-white/20 bg-gradient-to-r from-blue-500/80 to-indigo-600/80 px-6 backdrop-blur-xl lg:h-30 lg:px-8"
	>
		<div class="flex items-center space-x-3 lg:space-x-4">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 shadow-lg backdrop-blur-sm lg:h-12 lg:w-12"
			>
				<span class="text-lg font-bold text-blue-600 lg:text-xl">₹</span>
			</div>
			<div>
				<h1 class="app-title leading-tight font-bold text-white">Family Finance</h1>
				<p class="app-tagline mt-0.5 text-blue-100/90">Budgeting & Expense Tracker</p>
			</div>
		</div>

		<!-- Close button for mobile with glassmorphism -->
		<button
			class="rounded-xl bg-white/10 p-2 text-white/90 backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:text-white lg:hidden"
			onclick={closeSidebar}
			aria-label="Close sidebar"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
		</button>
	</div>

	<!-- User info with glassmorphism -->
	<div class="border-b border-white/20 bg-white/30 px-6 py-4 backdrop-blur-sm lg:px-8 lg:py-6">
		<div class="flex items-center space-x-3 lg:space-x-4">
			<div class="flex-shrink-0">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400/80 to-indigo-500/80 shadow-lg backdrop-blur-sm lg:h-12 lg:w-12"
				>
					<span class="text-sm font-medium text-white lg:text-base">
						{getUserInitials(data.session?.user)}
					</span>
				</div>
			</div>
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-medium text-gray-800 lg:text-base">
					{getUserDisplayName(data.session?.user)}
				</p>
				<p class="truncate text-xs text-gray-600 lg:text-sm">
					{data.session?.user?.email}
				</p>
			</div>
		</div>
	</div>

	<!-- Navigation with glassmorphism -->
	<nav class="flex-1 space-y-2 overflow-y-auto px-4 py-6 lg:space-y-3 lg:px-6 lg:py-8">
		{#each navigation as item}
			<a
				href={item.href}
				class="group flex items-center rounded-xl px-4 py-1 text-sm font-medium transition-all duration-200 lg:px-6 lg:py-4 lg:text-base
					{currentPath === item.href
					? 'border border-white/40 bg-white/60 text-blue-700 shadow-lg shadow-blue-500/10 backdrop-blur-sm'
					: 'text-gray-600 hover:bg-white/40 hover:text-blue-700 hover:shadow-md hover:shadow-black/5 hover:backdrop-blur-sm'}"
				onclick={closeSidebar}
			>
				<span
					class="mr-3 text-lg transition-transform duration-200 group-hover:scale-110 lg:mr-4 lg:text-xl"
				>
					{item.icon}
				</span>
				<span class="flex-1">{item.name}</span>

				{#if currentPath === item.href}
					<span class="ml-auto">
						<div class="h-2 w-2 rounded-full bg-blue-500"></div>
					</span>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- Sidebar footer with glassmorphism -->
	<div class="flex-shrink-0 border-t border-white/20 bg-white/30 p-4 backdrop-blur-sm lg:p-6">
		<div class="space-y-3 lg:space-y-4">
			<!-- Sign out button with glassmorphism -->
			<button
				onclick={handleSignOut}
				class="flex w-full items-center justify-center rounded-xl border border-white/40 bg-white/40 px-4 py-2.5 text-xs font-medium text-gray-600 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-red-200 hover:bg-white/60 hover:text-red-600 hover:shadow-md lg:px-6 lg:py-3 lg:text-sm"
			>
				<svg
					class="mr-2 h-4 w-4 lg:h-5 lg:w-5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
					/>
				</svg>
				Sign Out
			</button>
		</div>
	</div>
</div>

<style>
	.app-title {
		font-size: 0.875rem !important;
	}

	.app-tagline {
		font-size: 0.75rem !important;
	}

	@media (min-width: 1024px) {
		.app-title {
			font-size: 1.25rem !important;
		}

		.app-tagline {
			font-size: 1rem !important;
		}
	}
</style>

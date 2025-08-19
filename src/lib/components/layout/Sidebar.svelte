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
<div class="fixed inset-y-0 left-0 z-50 w-72 lg:w-80 xl:w-84 bg-white/70 backdrop-blur-2xl border-r border-white/30 shadow-2xl shadow-black/10 transform transition-all duration-300 ease-in-out
	{sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
	lg:translate-x-0 lg:static lg:inset-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
	
	<!-- Sidebar header with glassmorphism -->
	<div class="flex items-center justify-between h-16 lg:h-20 px-6 lg:px-8 bg-gradient-to-r from-blue-500/80 to-indigo-600/80 backdrop-blur-xl border-b border-white/20">
		<div class="flex items-center space-x-3 lg:space-x-4">
			<div class="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg">
				<span class="text-blue-600 text-lg lg:text-xl font-bold">₹</span>
			</div>
			<div>
				<h1 class="app-title font-bold text-white leading-tight">Family Finance</h1>
				<p class="app-tagline text-blue-100/90 mt-0.5">Budgeting & Expense Tracker</p>
			</div>
		</div>
		
		<!-- Close button for mobile with glassmorphism -->
		<button
			class="lg:hidden text-white/90 hover:text-white p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
			onclick={closeSidebar}
			aria-label="Close sidebar"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>

	<!-- User info with glassmorphism -->
	<div class="px-6 lg:px-8 py-4 lg:py-6 bg-white/30 backdrop-blur-sm border-b border-white/20">
		<div class="flex items-center space-x-3 lg:space-x-4">
			<div class="flex-shrink-0">
				<div class="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-400/80 to-indigo-500/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
					<span class="text-white text-sm lg:text-base font-medium">
						{getUserInitials(data.session?.user)}
					</span>
				</div>
			</div>
			<div class="flex-1 min-w-0">
				<p class="text-sm lg:text-base font-medium text-gray-800 truncate">
					{getUserDisplayName(data.session?.user)}
				</p>
				<p class="text-xs lg:text-sm text-gray-600 truncate">
					{data.session?.user?.email}
				</p>
			</div>
		</div>
	</div>

	<!-- Navigation with glassmorphism -->
	<nav class="flex-1 px-4 lg:px-6 py-6 lg:py-8 space-y-2 lg:space-y-3 overflow-y-auto">
		{#each navigation as item}
			<a
				href={item.href}
				class="group flex items-center px-4 lg:px-6 py-3.5 lg:py-4 text-sm lg:text-base font-medium rounded-xl transition-all duration-200
					{currentPath === item.href
						? 'bg-white/60 backdrop-blur-sm text-blue-700 shadow-lg shadow-blue-500/10 border border-white/40'
						: 'text-gray-600 hover:text-blue-700 hover:bg-white/40 hover:backdrop-blur-sm hover:shadow-md hover:shadow-black/5'}"
				onclick={closeSidebar}
			>
				<span class="mr-3 lg:mr-4 text-lg lg:text-xl group-hover:scale-110 transition-transform duration-200">
					{item.icon}
				</span>
				<span class="flex-1">{item.name}</span>
				
				{#if currentPath === item.href}
					<span class="ml-auto">
						<div class="w-2 h-2 bg-blue-500 rounded-full"></div>
					</span>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- Sidebar footer with glassmorphism -->
	<div class="flex-shrink-0 p-4 lg:p-6 border-t border-white/20 bg-white/30 backdrop-blur-sm">
		<div class="space-y-3 lg:space-y-4">
			<!-- Sign out button with glassmorphism -->
			<button
				onclick={handleSignOut}
				class="w-full flex items-center justify-center px-4 lg:px-6 py-2.5 lg:py-3 text-xs lg:text-sm font-medium text-gray-600 hover:text-red-600 bg-white/40 hover:bg-white/60 backdrop-blur-sm border border-white/40 hover:border-red-200 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
			>
				<svg class="w-4 h-4 lg:w-5 lg:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
				</svg>
				Sign Out
			</button>
		</div>
	</div>
</div>
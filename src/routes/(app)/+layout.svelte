<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { user } from '$lib/store';
	import { signOut } from '$lib/supabaseClient';
	import { Button } from '$lib/components';

	let { data, children } = $props();

	// Keep the user store in sync with the server session
	if (data.session?.user) {
		user.set(data.session.user);
	}

	async function handleSignOut() {
		try {
			await signOut();
			goto('/');
		} catch (error) {
			console.error('Error signing out:', error);
		}
	}

	// Navigation items
	const navigation = [
		{ name: 'Dashboard', href: '/dashboard', icon: '🏠' },
		{ name: 'Accounts', href: '/accounts', icon: '🏦' },
		{ name: 'Categories', href: '/categories', icon: '📋' },
		{ name: 'Transactions', href: '/transactions', icon: '💰' },
		{ name: 'Budget', href: '/budget', icon: '📊' },
		{ name: 'Goals', href: '/goals', icon: '🎯' },
		{ name: 'Reports', href: '/reports', icon: '📈' },
		{ name: 'Settings', href: '/settings', icon: '⚙️' }
	];

	const currentPath = $derived($page.url.pathname);
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 items-center justify-between">
				<!-- Logo and Title -->
				<div class="flex items-center space-x-2">
					<div class="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
						<span class="text-white text-lg font-bold">₹</span>
					</div>
					<h1 class="text-xl font-bold text-gray-900">Family Finance</h1>
				</div>

				<!-- Desktop Navigation - Scrollable if needed -->
				<nav class="hidden lg:flex space-x-1 overflow-x-auto max-w-2xl">
					{#each navigation as item}
						<a
							href={item.href}
							class="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
								{currentPath === item.href
									? 'bg-blue-600 text-white shadow-md'
									: 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}"
						>
							<span class="text-lg">{item.icon}</span>
							<span class="hidden xl:inline">{item.name}</span>
						</a>
					{/each}
				</nav>

				<!-- Tablet Navigation - Icon only -->
				<nav class="hidden md:flex lg:hidden space-x-1">
					{#each navigation as item}
						<a
							href={item.href}
							class="flex items-center justify-center w-10 h-10 rounded-lg text-lg transition-all duration-200
								{currentPath === item.href
									? 'bg-blue-600 text-white shadow-md'
									: 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}"
							title={item.name}
						>
							<span>{item.icon}</span>
						</a>
					{/each}
				</nav>

				<!-- User Menu -->
				<div class="flex items-center space-x-3">
					<div class="hidden sm:block text-right">
						<p class="text-xs text-gray-500">Welcome back,</p>
						<p class="text-sm font-medium text-gray-900 truncate max-w-32">
							{data.session?.user?.user_metadata?.display_name ||
							 data.session?.user?.email?.split('@')[0] ||
							 'User'}
						</p>
					</div>
					<Button variant="outline" size="sm" on:click={handleSignOut} class="text-xs">
						Sign Out
					</Button>
				</div>
			</div>
		</div>

		<!-- Mobile Navigation - Bottom style -->
		<div class="md:hidden border-t border-gray-200 bg-white">
			<div class="grid grid-cols-4 gap-1 px-2 py-2">
				{#each navigation.slice(0, 8) as item}
					<a
						href={item.href}
						class="flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-all duration-200
							{currentPath === item.href
								? 'bg-blue-600 text-white'
								: 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}"
					>
						<span class="text-lg mb-1">{item.icon}</span>
						<span class="truncate w-full text-center">{item.name}</span>
					</a>
				{/each}
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
		{@render children?.()}
	</main>

	<!-- Footer -->
	<footer class="bg-white border-t border-gray-200 mt-auto">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
			<div class="flex items-center justify-between">
				<p class="text-sm text-gray-600">
					© 2024 Family Finance. Built with YNAB methodology for Indian families.
				</p>
				<div class="flex space-x-4 text-sm text-gray-600">
					<a href="/components-demo" class="hover:text-gray-900">Components</a>
					<a href="/charts-demo" class="hover:text-gray-900">Charts</a>
					<a href="/test-db" class="hover:text-gray-900">Database</a>
				</div>
			</div>
		</div>
	</footer>
</div>
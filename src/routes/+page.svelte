<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components';

	let { data } = $props();

	// Redirect to dashboard if already logged in
	$effect(() => {
		if (data.session?.user) {
			goto('/dashboard');
		}
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
	<!-- Header -->
	<header class="relative bg-white shadow-sm">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between py-6">
				<div class="flex items-center">
					<h1 class="text-2xl font-bold text-gray-900">Family Finance</h1>
				</div>
				<div class="flex items-center space-x-4">
					<Button variant="outline">
						<a href="/login">Sign In</a>
					</Button>
					<Button>
						<a href="/signup">Get Started</a>
					</Button>
				</div>
			</div>
		</div>
	</header>

	<!-- Hero Section -->
	<main class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
		<div class="text-center">
			<h2 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
				Take Control of Your
				<span class="text-blue-600">Family Finances</span>
			</h2>
			<p class="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
				Track expenses, set budgets, and achieve financial goals together.
				Built with the proven Budgeting methodology for families.
			</p>
			<div class="mt-10 flex items-center justify-center gap-x-6">
				<Button size="lg">
					<a href="/signup">Start Free Trial</a>
				</Button>
				<Button variant="outline" size="lg">
					<a href="/login">Sign In</a>
				</Button>
			</div>
		</div>

		<!-- Features -->
		<div class="mt-20">
			<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
				<div class="text-center">
					<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-blue-100">
						<span class="text-2xl">💰</span>
					</div>
					<h3 class="mt-4 text-lg font-semibold text-gray-900">The Budgeting Methodology</h3>
					<p class="mt-2 text-gray-600">
						Be proud that every penny of yours is budgeted for.
					</p>
				</div>
				<div class="text-center">
					<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-green-100">
						<span class="text-2xl">👨‍👩‍👧‍👦</span>
					</div>
					<h3 class="mt-4 text-lg font-semibold text-gray-900">Family Collaboration</h3>
					<p class="mt-2 text-gray-600">
						Work together with family members to manage your household budget.
					</p>
				</div>
				<div class="text-center">
					<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-purple-100">
						<span class="text-2xl">📊</span>
					</div>
					<h3 class="mt-4 text-lg font-semibold text-gray-900">Smart Analytics</h3>
					<p class="mt-2 text-gray-600">
						Visualize your spending patterns and track progress toward goals.
					</p>
				</div>
			</div>
		</div>
	</main>
</div>

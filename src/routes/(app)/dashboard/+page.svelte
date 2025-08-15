<script lang="ts">
	import { user } from '$lib/store';
	import { Card, Button } from '$lib/components';

	let { data } = $props();

	// Keep the user store in sync with the server session
	if (data.session?.user) {
		user.set(data.session.user);
	}
</script>

<svelte:head>
	<title>Dashboard - Family Finance</title>
</svelte:head>

<div class="space-y-8">
	<!-- Welcome Section -->
	<div class="bg-white rounded-lg shadow-sm p-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">
					Welcome back, {data.session?.user?.user_metadata?.display_name || data.session?.user?.email?.split('@')[0]}!
				</h1>
				<p class="mt-2 text-gray-600">
					Here's your family finance overview for today.
				</p>
			</div>
			<div class="text-right">
				<p class="text-sm text-gray-500">Signed in as</p>
				<p class="font-medium text-gray-900">{data.session?.user?.email}</p>
			</div>
		</div>
	</div>

	<!-- Quick Stats -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<Card title="Account Balance" class="text-center">
			<div class="text-3xl font-bold text-green-600">₹85,750</div>
			<p class="text-sm text-gray-600 mt-1">Total across all accounts</p>
		</Card>
		
		<Card title="This Month's Budget" class="text-center">
			<div class="text-3xl font-bold text-blue-600">₹45,000</div>
			<p class="text-sm text-gray-600 mt-1">₹12,500 remaining</p>
		</Card>
		
		<Card title="Savings Goal" class="text-center">
			<div class="text-3xl font-bold text-purple-600">68%</div>
			<p class="text-sm text-gray-600 mt-1">Emergency fund progress</p>
		</Card>
	</div>

	<!-- Quick Actions -->
	<Card title="Quick Actions">
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<Button variant="outline" class="h-20 flex flex-col items-center justify-center">
				<span class="text-2xl mb-2">💰</span>
				<span class="text-sm">Add Transaction</span>
			</Button>
			<Button variant="outline" class="h-20 flex flex-col items-center justify-center">
				<span class="text-2xl mb-2">🏦</span>
				<span class="text-sm">Manage Accounts</span>
			</Button>
			<Button variant="outline" class="h-20 flex flex-col items-center justify-center">
				<span class="text-2xl mb-2">📊</span>
				<span class="text-sm">View Budget</span>
			</Button>
			<Button variant="outline" class="h-20 flex flex-col items-center justify-center">
				<span class="text-2xl mb-2">🎯</span>
				<span class="text-sm">Set Goals</span>
			</Button>
		</div>
	</Card>

	<!-- Recent Activity -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<Card title="Recent Transactions">
			<div class="space-y-4">
				<div class="flex justify-between items-center py-2 border-b border-gray-100">
					<div>
						<p class="font-medium">Grocery Shopping</p>
						<p class="text-sm text-gray-600">Yesterday • Food</p>
					</div>
					<span class="text-red-600 font-semibold">-₹1,250</span>
				</div>
				<div class="flex justify-between items-center py-2 border-b border-gray-100">
					<div>
						<p class="font-medium">Salary Deposit</p>
						<p class="text-sm text-gray-600">2 days ago • Income</p>
					</div>
					<span class="text-green-600 font-semibold">+₹75,000</span>
				</div>
				<div class="flex justify-between items-center py-2">
					<div>
						<p class="font-medium">Electricity Bill</p>
						<p class="text-sm text-gray-600">3 days ago • Utilities</p>
					</div>
					<span class="text-red-600 font-semibold">-₹2,150</span>
				</div>
			</div>
			<div class="mt-4 pt-4 border-t border-gray-200">
				<Button variant="outline" size="sm" fullWidth>View All Transactions</Button>
			</div>
		</Card>

		<Card title="Budget Overview">
			<div class="space-y-4">
				<div>
					<div class="flex justify-between text-sm">
						<span>Food & Dining</span>
						<span>₹8,500 / ₹12,000</span>
					</div>
					<div class="mt-1 bg-gray-200 rounded-full h-2">
						<div class="bg-green-500 h-2 rounded-full" style="width: 71%"></div>
					</div>
				</div>
				<div>
					<div class="flex justify-between text-sm">
						<span>Transportation</span>
						<span>₹5,200 / ₹8,000</span>
					</div>
					<div class="mt-1 bg-gray-200 rounded-full h-2">
						<div class="bg-yellow-500 h-2 rounded-full" style="width: 65%"></div>
					</div>
				</div>
				<div>
					<div class="flex justify-between text-sm">
						<span>Entertainment</span>
						<span>₹3,800 / ₹4,000</span>
					</div>
					<div class="mt-1 bg-gray-200 rounded-full h-2">
						<div class="bg-red-500 h-2 rounded-full" style="width: 95%"></div>
					</div>
				</div>
			</div>
			<div class="mt-4 pt-4 border-t border-gray-200">
				<Button variant="outline" size="sm" fullWidth>Manage Budget</Button>
			</div>
		</Card>
	</div>
</div>

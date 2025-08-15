<script lang="ts">
	import { Button, Input, Card, Modal, TransactionRow, AccountCard } from '$lib/components';

	let modalOpen = false;
	let inputValue = '';
	let inputError = '';

	// Sample data for demonstrations
	const sampleTransactions = [
		{
			id: '1',
			description: 'Grocery Shopping',
			amount: -85.5,
			category: 'Food',
			account: 'Checking',
			date: new Date('2024-01-15'),
			isCleared: true,
			memo: 'Weekly groceries at Walmart'
		},
		{
			id: '2',
			description: 'Salary Deposit',
			amount: 3500.0,
			category: 'Income',
			account: 'Checking',
			date: new Date('2024-01-15'),
			isCleared: true
		},
		{
			id: '3',
			description: 'Gas Station',
			amount: -45.25,
			category: 'Transportation',
			account: 'Credit Card',
			date: new Date('2024-01-14'),
			isCleared: false
		}
	];

	const sampleAccounts = [
		{
			id: '1',
			name: 'Primary Checking',
			type: 'checking' as const,
			balance: 2450.75,
			isActive: true
		},
		{
			id: '2',
			name: 'Emergency Savings',
			type: 'savings' as const,
			balance: 15000.0,
			isActive: true
		},
		{
			id: '3',
			name: 'Credit Card',
			type: 'credit_card' as const,
			balance: 1250.3,
			isActive: true
		},
		{
			id: '4',
			name: 'Investment Account',
			type: 'investment' as const,
			balance: 8750.25,
			isActive: true
		}
	];

	function handleInputChange() {
		if (inputValue.length < 3) {
			inputError = 'Must be at least 3 characters';
		} else {
			inputError = '';
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<div class="container mx-auto space-y-16 p-6">
		<div class="rounded-lg bg-white p-8 text-center shadow-sm">
			<h1 class="mb-4 text-4xl font-bold text-gray-900">Component Library Demo</h1>
			<p class="text-lg text-gray-600">Comprehensive UI components for family finance management</p>
		</div>

		<!-- UI Components Section -->
		<section class="space-y-8">
			<h2 class="mb-8 text-2xl font-bold text-gray-900">UI Components</h2>

			<!-- Buttons -->
			<Card title="Buttons" class="mb-8" shadow="md">
				<div class="space-y-4">
					<div>
						<h4 class="mb-3 text-sm font-medium text-gray-700">Variants</h4>
						<div class="flex flex-wrap gap-4">
							<Button variant="primary">Primary</Button>
							<Button variant="secondary">Secondary</Button>
							<Button variant="danger">Danger</Button>
							<Button variant="success">Success</Button>
							<Button variant="outline">Outline</Button>
						</div>
					</div>

					<div>
						<h4 class="mb-3 text-sm font-medium text-gray-700">Sizes</h4>
						<div class="flex flex-wrap items-center gap-4">
							<Button size="sm">Small</Button>
							<Button size="md">Medium</Button>
							<Button size="lg">Large</Button>
						</div>
					</div>

					<div>
						<h4 class="mb-3 text-sm font-medium text-gray-700">States</h4>
						<div class="flex flex-wrap gap-4">
							<Button loading>Loading</Button>
							<Button disabled>Disabled</Button>
						</div>
						<div class="mt-4">
							<Button fullWidth>Full Width</Button>
						</div>
					</div>
				</div>
			</Card>

			<!-- Inputs -->
			<Card title="Input Fields" class="mb-8" shadow="md">
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<Input label="Email Address" type="email" placeholder="Enter your email" required />
					<Input label="Password" type="password" placeholder="Enter password" />
					<Input
						label="Amount"
						type="number"
						placeholder="0.00"
						bind:value={inputValue}
						error={inputError}
						on:input={handleInputChange}
					/>
					<Input label="Disabled Field" placeholder="Cannot edit" disabled />
				</div>
			</Card>

			<!-- Cards -->
			<div class="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
				<Card title="Basic Card" subtitle="Simple card with title" shadow="md">
					<p class="text-gray-600">This is a basic card component with title and subtitle.</p>
				</Card>

				<Card shadow="lg" border={false}>
					<div slot="header">
						<h3 class="text-lg font-semibold text-gray-900">Custom Header</h3>
					</div>
					<p class="text-gray-600">This card uses slots for custom header content.</p>
					<div slot="footer">
						<Button size="sm" variant="outline">Action</Button>
					</div>
				</Card>

				<Card hover padding="lg" shadow="md">
					<h3 class="mb-2 text-lg font-semibold text-gray-900">Hover Effect</h3>
					<p class="text-gray-600">This card has hover effects and larger padding.</p>
				</Card>
			</div>

			<!-- Modal -->
			<Card title="Modal Component" class="mb-8" shadow="md">
				<div class="space-y-4">
					<Button on:click={() => (modalOpen = true)}>Open Modal</Button>

					<Modal bind:open={modalOpen} title="Sample Modal" size="md">
						<p class="mb-4 text-gray-600">
							This is a sample modal dialog. It can contain any content and supports different
							sizes.
						</p>
						<Input label="Sample Input" placeholder="Enter something..." />

						<div slot="footer">
							<Button variant="outline" on:click={() => (modalOpen = false)}>Cancel</Button>
							<Button on:click={() => (modalOpen = false)}>Save</Button>
						</div>
					</Modal>
				</div>
			</Card>
		</section>

		<!-- Finance Components Section -->
		<section class="space-y-8">
			<h2 class="mb-8 text-2xl font-bold text-gray-900">Finance Components</h2>

			<!-- Account Cards -->
			<Card title="Account Cards" class="mb-8" shadow="md">
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
					{#each sampleAccounts as account (account.id)}
						<AccountCard {account} clickable />
					{/each}
				</div>
			</Card>

			<!-- Transaction Rows -->
			<Card title="Transaction List" class="mb-8" shadow="md">
				<div class="-mx-6 divide-y divide-gray-200">
					{#each sampleTransactions as transaction (transaction.id)}
						<div class="px-6">
							<TransactionRow {transaction} clickable />
						</div>
					{/each}
				</div>
			</Card>
		</section>

		<!-- Features Overview -->
		<section class="space-y-8">
			<h2 class="mb-8 text-2xl font-bold text-gray-900">Component Features</h2>

			<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
				<Card shadow="md">
					<div class="text-center">
						<div
							class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100"
						>
							<span class="text-2xl">🎨</span>
						</div>
						<h3 class="mb-2 text-lg font-semibold text-gray-900">Consistent Design</h3>
						<p class="text-sm text-gray-600">
							Unified design system with consistent colors, typography, and spacing across all
							components.
						</p>
					</div>
				</Card>

				<Card shadow="md">
					<div class="text-center">
						<div
							class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100"
						>
							<span class="text-2xl">♿</span>
						</div>
						<h3 class="mb-2 text-lg font-semibold text-gray-900">Accessible</h3>
						<p class="text-sm text-gray-600">
							Built with accessibility in mind, including proper ARIA labels, keyboard navigation,
							and screen reader support.
						</p>
					</div>
				</Card>

				<Card shadow="md">
					<div class="text-center">
						<div
							class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100"
						>
							<span class="text-2xl">📱</span>
						</div>
						<h3 class="mb-2 text-lg font-semibold text-gray-900">Responsive</h3>
						<p class="text-sm text-gray-600">
							Mobile-first design that works perfectly on all device sizes and screen resolutions.
						</p>
					</div>
				</Card>

				<Card shadow="md">
					<div class="text-center">
						<div
							class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100"
						>
							<span class="text-2xl">⚡</span>
						</div>
						<h3 class="mb-2 text-lg font-semibold text-gray-900">Performance</h3>
						<p class="text-sm text-gray-600">
							Optimized for speed with minimal bundle size and efficient rendering using Svelte.
						</p>
					</div>
				</Card>

				<Card shadow="md">
					<div class="text-center">
						<div
							class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-100"
						>
							<span class="text-2xl">🔧</span>
						</div>
						<h3 class="mb-2 text-lg font-semibold text-gray-900">Customizable</h3>
						<p class="text-sm text-gray-600">
							Highly configurable components with props for styling, behavior, and content
							customization.
						</p>
					</div>
				</Card>

				<Card shadow="md">
					<div class="text-center">
						<div
							class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100"
						>
							<span class="text-2xl">💰</span>
						</div>
						<h3 class="mb-2 text-lg font-semibold text-gray-900">Finance-Focused</h3>
						<p class="text-sm text-gray-600">
							Specialized components designed specifically for financial applications with currency
							formatting and data visualization.
						</p>
					</div>
				</Card>
			</div>
		</section>

		<!-- Navigation -->
		<div class="pt-12 pb-8 text-center">
			<div class="rounded-lg bg-white p-6 shadow-sm">
				<div class="space-x-4">
					<Button variant="outline">
						<a href="/charts-demo">View Charts Demo</a>
					</Button>
					<Button variant="outline">
						<a href="/test-db">Database Test</a>
					</Button>
					<Button>
						<a href="/">Back to Home</a>
					</Button>
				</div>
			</div>
		</div>
	</div>
</div>

<script lang="ts">
	import {
		Button,
		Input,
		Card,
		Modal,
		Select,
		Table,
		Badge,
		Spinner,
		BudgetProgressBar,
		CurrencyInput,
		FinanceChart
	} from '$lib/components';
	import { createExpenseByCategory } from '$lib/components/charts/ChartUtils';

	// Demo data and state
	let modalOpen = $state(false);
	let inputValue = $state('');
	let selectValue = $state('');
	let currencyValue = $state(1500);
	let tableSort = $state({ column: '', direction: 'asc' });

	const selectOptions = [
		{ value: 'option1', label: 'Income' },
		{ value: 'option2', label: 'Expense' },
		{ value: 'option3', label: 'Investment' },
		{ value: 'option4', label: 'Savings', disabled: true }
	];

	const sampleExpenseData = [
		{ category: 'Food', amount: 5000 },
		{ category: 'Transport', amount: 3000 },
		{ category: 'Entertainment', amount: 2000 },
		{ category: 'Utilities', amount: 2500 }
	];

	const chartData = createExpenseByCategory(sampleExpenseData);

	const tableHeaders = ['Category', 'Budget', 'Spent', 'Status'];
	const budgetData = [
		{ category: 'Food & Dining', budget: 12000, spent: 8500, status: 'on-track' },
		{ category: 'Transportation', budget: 8000, spent: 9200, status: 'over' },
		{ category: 'Entertainment', budget: 4000, spent: 2100, status: 'under' },
		{ category: 'Utilities', budget: 6000, spent: 5800, status: 'on-track' }
	];
</script>

<svelte:head>
	<title>Component Library Demo - Family Finance</title>
</svelte:head>

<div class="max-w-7xl mx-auto p-6 space-y-12">
	<!-- Header -->
	<div class="text-center">
		<h1 class="text-4xl font-bold text-gray-900 mb-4">Component Library Demo</h1>
		<p class="text-lg text-gray-600">
			Comprehensive showcase of all UI and finance-specific components
		</p>
	</div>

	<!-- Basic UI Components -->
	<section>
		<h2 class="text-2xl font-bold text-gray-900 mb-6">Basic UI Components</h2>
		
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<!-- Buttons -->
			<Card title="Buttons">
				<div class="space-y-4">
					<div class="flex flex-wrap gap-2">
						<Button variant="primary">Primary</Button>
						<Button variant="secondary">Secondary</Button>
						<Button variant="outline">Outline</Button>
						<Button variant="danger">Danger</Button>
						<Button variant="success">Success</Button>
					</div>
					<div class="flex flex-wrap gap-2">
						<Button size="sm">Small</Button>
						<Button size="md">Medium</Button>
						<Button size="lg">Large</Button>
					</div>
					<div class="flex flex-wrap gap-2">
						<Button loading={true}>Loading</Button>
						<Button disabled={true}>Disabled</Button>
					</div>
				</div>
			</Card>

			<!-- Badges -->
			<Card title="Badges">
				<div class="space-y-4">
					<div class="flex flex-wrap gap-2">
						<Badge variant="default">Default</Badge>
						<Badge variant="success">Success</Badge>
						<Badge variant="warning">Warning</Badge>
						<Badge variant="danger">Danger</Badge>
						<Badge variant="info">Info</Badge>
						<Badge variant="secondary">Secondary</Badge>
					</div>
					<div class="flex flex-wrap gap-2">
						<Badge size="sm">Small</Badge>
						<Badge size="md">Medium</Badge>
						<Badge size="lg">Large</Badge>
					</div>
					<div class="flex flex-wrap gap-2">
						<Badge removable={true} variant="success">Removable</Badge>
						<Badge rounded={false} variant="info">Square</Badge>
					</div>
				</div>
			</Card>

			<!-- Spinners -->
			<Card title="Loading Spinners">
				<div class="space-y-4">
					<div class="flex items-center gap-4">
						<Spinner size="sm" />
						<Spinner size="md" />
						<Spinner size="lg" />
						<Spinner size="xl" />
					</div>
					<div class="flex items-center gap-4">
						<Spinner color="blue" />
						<Spinner color="green" />
						<Spinner color="red" />
						<Spinner color="yellow" />
					</div>
					<Spinner centered={true} class="py-8" />
				</div>
			</Card>

			<!-- Modal -->
			<Card title="Modal">
				<div class="space-y-4">
					<Button on:click={() => modalOpen = true}>Open Modal</Button>
					<p class="text-sm text-gray-600">
						Click the button above to see the modal component in action.
					</p>
				</div>
			</Card>
		</div>
	</section>

	<!-- Form Components -->
	<section>
		<h2 class="text-2xl font-bold text-gray-900 mb-6">Form Components</h2>
		
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<!-- Input -->
			<Card title="Text Input">
				<div class="space-y-4">
					<Input
						label="Standard Input"
						bind:value={inputValue}
						placeholder="Enter some text..."
					/>
					<Input
						label="Required Input"
						required={true}
						placeholder="This field is required"
					/>
					<Input
						label="Input with Error"
						error="This field has an error"
						placeholder="Error state"
					/>
					<Input
						label="Disabled Input"
						disabled={true}
						placeholder="Disabled input"
					/>
				</div>
			</Card>

			<!-- Select -->
			<Card title="Select Dropdown">
				<div class="space-y-4">
					<Select
						label="Category Type"
						bind:value={selectValue}
						options={selectOptions}
						placeholder="Choose a category..."
					/>
					<Select
						label="Required Select"
						required={true}
						options={selectOptions}
						placeholder="Required field"
					/>
					<Select
						label="Select with Error"
						error="Please select an option"
						options={selectOptions}
					/>
				</div>
			</Card>

			<!-- Currency Input -->
			<Card title="Currency Input" class="lg:col-span-2">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<CurrencyInput
						label="Amount"
						bind:value={currencyValue}
						placeholder="Enter amount..."
					/>
					<CurrencyInput
						label="Required Amount"
						required={true}
						placeholder="Required field"
					/>
					<CurrencyInput
						label="Amount with Error"
						error="Amount must be positive"
						value={-100}
					/>
					<CurrencyInput
						label="Disabled Amount"
						disabled={true}
						value={5000}
					/>
				</div>
			</Card>
		</div>
	</section>

	<!-- Finance Components -->
	<section>
		<h2 class="text-2xl font-bold text-gray-900 mb-6">Finance Components</h2>
		
		<div class="space-y-8">
			<!-- Budget Progress Bars -->
			<Card title="Budget Progress Bars">
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<BudgetProgressBar
						categoryName="Food & Dining"
						budgeted={12000}
						spent={8500}
					/>
					<BudgetProgressBar
						categoryName="Transportation"
						budgeted={8000}
						spent={9200}
					/>
					<BudgetProgressBar
						categoryName="Entertainment"
						budgeted={4000}
						spent={600}
					/>
					<BudgetProgressBar
						categoryName="Utilities"
						budgeted={6000}
						spent={5800}
					/>
				</div>
			</Card>

			<!-- Chart Demo -->
			<Card title="Financial Charts">
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<div>
						<h4 class="font-medium text-gray-900 mb-4">Expense Breakdown</h4>
						<FinanceChart
							type="doughnut"
							data={chartData}
							height="300px"
						/>
					</div>
					<div class="space-y-4">
						<h4 class="font-medium text-gray-900">Chart Features</h4>
						<ul class="text-sm text-gray-600 space-y-2">
							<li>• Interactive tooltips with Indian currency formatting</li>
							<li>• Responsive design for all screen sizes</li>
							<li>• Real-time data updates</li>
							<li>• Multiple chart types (line, bar, doughnut)</li>
							<li>• Consistent color scheme</li>
							<li>• Accessibility compliant</li>
						</ul>
					</div>
				</div>
			</Card>
		</div>
	</section>

	<!-- Data Display -->
	<section>
		<h2 class="text-2xl font-bold text-gray-900 mb-6">Data Display</h2>
		
		<Card title="Data Table">
			<Table headers={tableHeaders} sortable={true}>
				{#each budgetData as row, index}
					<tr class="hover:bg-gray-50">
						<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
							{row.category}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
							₹{row.budget.toLocaleString('en-IN')}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
							₹{row.spent.toLocaleString('en-IN')}
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							{#if row.status === 'over'}
								<Badge variant="danger">Over Budget</Badge>
							{:else if row.status === 'under'}
								<Badge variant="success">Under Budget</Badge>
							{:else}
								<Badge variant="info">On Track</Badge>
							{/if}
						</td>
					</tr>
				{/each}
			</Table>
		</Card>
	</section>

	<!-- Component Usage Guide -->
	<section>
		<h2 class="text-2xl font-bold text-gray-900 mb-6">Usage Guide</h2>
		
		<Card title="How to Use Components">
			<div class="prose max-w-none">
				<p class="text-gray-600 mb-4">
					All components are available through a single import from the component library:
				</p>
				<pre class="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>import &#123; Button, Input, Card, Modal, Select, Table, Badge, Spinner, BudgetProgressBar, CurrencyInput, FinanceChart &#125; from '$lib/components';</code></pre>
				
				<div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<h4 class="font-medium text-gray-900 mb-2">UI Components</h4>
						<ul class="text-sm text-gray-600 space-y-1">
							<li>• <strong>Button</strong> - Various styles and states</li>
							<li>• <strong>Input</strong> - Text input with validation</li>
							<li>• <strong>Select</strong> - Dropdown with options</li>
							<li>• <strong>Table</strong> - Sortable data table</li>
							<li>• <strong>Badge</strong> - Status indicators</li>
							<li>• <strong>Spinner</strong> - Loading states</li>
							<li>• <strong>Card</strong> - Content containers</li>
							<li>• <strong>Modal</strong> - Dialog overlays</li>
						</ul>
					</div>
					<div>
						<h4 class="font-medium text-gray-900 mb-2">Finance Components</h4>
						<ul class="text-sm text-gray-600 space-y-1">
							<li>• <strong>CurrencyInput</strong> - Rupee amount input</li>
							<li>• <strong>BudgetProgressBar</strong> - Budget tracking</li>
							<li>• <strong>FinanceChart</strong> - Financial visualizations</li>
							<li>• <strong>AccountCard</strong> - Account display</li>
							<li>• <strong>TransactionRow</strong> - Transaction items</li>
						</ul>
					</div>
				</div>
			</div>
		</Card>
	</section>

	<!-- Navigation -->
	<div class="text-center pt-8">
		<a href="/dashboard" class="inline-flex items-center">
			<Button>← Back to Dashboard</Button>
		</a>
	</div>
</div>

<!-- Modal Demo -->
<Modal bind:open={modalOpen} title="Demo Modal">
	<div class="space-y-4">
		<p class="text-gray-600">
			This is a demonstration of the Modal component. It supports:
		</p>
		<ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
			<li>Custom titles</li>
			<li>Slot-based content</li>
			<li>Footer actions</li>
			<li>Backdrop dismissal</li>
			<li>Keyboard navigation (ESC to close)</li>
		</ul>
		
		<div class="flex items-center space-x-2">
			<Spinner size="sm" />
			<span class="text-sm text-gray-600">Components work inside modals too!</span>
		</div>
	</div>
	
	<div slot="footer">
		<Button variant="outline" on:click={() => modalOpen = false}>Cancel</Button>
		<Button on:click={() => modalOpen = false}>Got it!</Button>
	</div>
</Modal>

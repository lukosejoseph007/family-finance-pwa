<script lang="ts">
	import { formatCurrency } from '../charts/ChartUtils';
	import Card from '../ui/Card.svelte';

	export let account: {
		id: string;
		name: string;
		type: 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'loan';
		balance: number;
		isActive?: boolean;
	};

	export let clickable = false;
	export let showType = true;

	$: accountTypeConfig = {
		checking: { icon: '🏦', label: 'Checking', color: 'blue' },
		savings: { icon: '💰', label: 'Savings', color: 'green' },
		credit_card: { icon: '💳', label: 'Credit Card', color: 'red' },
		cash: { icon: '💵', label: 'Cash', color: 'yellow' },
		investment: { icon: '📈', label: 'Investment', color: 'purple' },
		loan: { icon: '🏠', label: 'Loan', color: 'orange' }
	};

	$: config = accountTypeConfig[account.type];
	$: isPositive = account.balance >= 0;
	$: isDebt = account.type === 'credit_card' || account.type === 'loan';

	$: balanceClasses = isDebt
		? account.balance > 0
			? 'text-red-600'
			: 'text-green-600'
		: isPositive
			? 'text-green-600'
			: 'text-red-600';

	$: typeClasses = `bg-${config.color}-100 text-${config.color}-800`;
</script>

<Card
	hover={clickable}
	shadow="sm"
	class="transition-all duration-200 {!account.isActive ? 'opacity-60' : ''}"
	on:click
>
	<div class="flex items-center justify-between">
		<div class="flex items-center space-x-3">
			<div class="text-2xl">
				{config.icon}
			</div>

			<div>
				<h3 class="font-medium text-gray-900">
					{account.name}
					{#if !account.isActive}
						<span class="ml-2 text-xs text-gray-500">(Inactive)</span>
					{/if}
				</h3>

				{#if showType}
					<span
						class="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-medium {typeClasses}"
					>
						{config.label}
					</span>
				{/if}
			</div>
		</div>

		<div class="text-right">
			<div class="text-lg font-semibold {balanceClasses}">
				{#if isDebt && account.balance !== 0}
					{account.balance > 0 ? '-' : ''}
				{/if}
				{formatCurrency(Math.abs(account.balance))}
			</div>

			{#if isDebt}
				<div class="text-xs text-gray-500">
					{account.balance > 0 ? 'Owed' : 'Available'}
				</div>
			{/if}
		</div>
	</div>

	<!-- Progress bar for credit cards -->
	{#if account.type === 'credit_card' && account.balance > 0}
		<div class="mt-3">
			<div class="mb-1 flex justify-between text-xs text-gray-600">
				<span>Used</span>
				<span>Limit</span>
			</div>
			<div class="h-2 w-full rounded-full bg-gray-200">
				<div
					class="h-2 rounded-full bg-red-500"
					style="width: {Math.min((account.balance / 5000) * 100, 100)}%"
				></div>
			</div>
		</div>
	{/if}
</Card>

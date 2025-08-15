<script lang="ts">
	import { formatCurrency } from '../charts/ChartUtils';

	export let transaction: {
		id: string;
		description: string;
		amount: number;
		category?: string;
		account?: string;
		date: Date | string;
		isCleared?: boolean;
		memo?: string;
	};

	export let showAccount = true;
	export let showCategory = true;
	export let clickable = false;

	$: formattedDate =
		typeof transaction.date === 'string'
			? new Date(transaction.date).toLocaleDateString()
			: transaction.date.toLocaleDateString();

	$: isIncome = transaction.amount > 0;
	$: amountClasses = isIncome ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold';
</script>

<div
	class="mb-4 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-6 py-10 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md {clickable
		? 'cursor-pointer'
		: ''}"
	on:click
>
	<!-- Transaction Info -->
	<div class="min-w-0 flex-1">
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<h4 class="truncate text-sm font-medium text-gray-900">
					{transaction.description}
				</h4>

				<div class="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
					<span
						class="inline-flex items-center rounded bg-gray-50 px-3 py-1.5 font-medium text-gray-700"
					>
						{formattedDate}
					</span>

					{#if showAccount && transaction.account}
						<span
							class="inline-flex items-center rounded-full bg-blue-100 px-4 py-1.5 font-medium text-blue-800"
						>
							{transaction.account}
						</span>
					{/if}

					{#if showCategory && transaction.category}
						<span
							class="inline-flex items-center rounded-full bg-gray-100 px-4 py-1.5 font-medium text-gray-800"
						>
							{transaction.category}
						</span>
					{/if}

					{#if transaction.isCleared}
						<span
							class="inline-flex items-center rounded-full bg-green-100 px-4 py-1.5 font-medium text-green-700"
						>
							<svg class="mr-2 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clip-rule="evenodd"
								/>
							</svg>
							Cleared
						</span>
					{/if}
				</div>

				{#if transaction.memo}
					<p class="mt-2 text-xs text-gray-400 italic">{transaction.memo}</p>
				{/if}
			</div>

			<!-- Amount -->
			<div class="ml-4 text-right">
				<div class={amountClasses}>
					{isIncome ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
				</div>
			</div>
		</div>
	</div>
</div>

<script lang="ts">
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	let selectedPeriod = $state<'day' | 'week' | 'month'>('month');
	let selectedDate = $state(new Date());
	let selectedType = $state<'income' | 'expense' | 'all'>('all');
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let remainingExports = $state<number | null>(null);

	async function checkRateLimit() {
		try {
			const response = await fetch('/api/export-rate-limit');
			if (response.ok) {
				const data = await response.json();
				remainingExports = data.remaining;
			}
		} catch (error) {
			console.error('Failed to check rate limit:', error);
		}
	}

	async function handleExport() {
		isLoading = true;
		error = null;

		try {
			// Verify family association first
			const familyCheck = await fetch('/api/check-family');
			if (!familyCheck.ok) {
				throw new Error('You need to join a family before exporting transactions');
			}
			const response = await fetch('/api/export-transactions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					period: selectedPeriod,
					referenceDate: selectedDate.toISOString(),
					transactionType: selectedType
				})
			});

			console.log('Response from server:', response);

			if (!response.ok) {
				const clonedResponse = response.clone();
				try {
					const errorData = await response.json();
					throw new Error(errorData.message || `Export failed with status ${response.status}`);
				} catch (e) {
					// If response is not JSON, fall back to text
					const errorText = await clonedResponse.text();
					throw new Error(errorText || `Export failed with status ${response.status}`);
				}
			}

			// Create download from blob
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `transactions-${selectedPeriod}-${selectedDate.toISOString().split('T')[0]}.csv`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			// Refresh rate limit
			await checkRateLimit();
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Failed to export transactions';
			console.error('Export error:', err);
		} finally {
			isLoading = false;
		}
	}

	// Helper to format date for display
	function formatDate(date: Date): string {
		return date.toLocaleDateString('en-IN', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Reactive variable for date input value - use $derived for proper reactivity
	let dateInputValue = $derived(selectedDate.toISOString().split('T')[0]);

	// Update selectedDate when dateInputValue changes
	function handleDateChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target && target.value) {
			selectedDate = new Date(target.value);
		}
	}

	// Check rate limit on component mount
	checkRateLimit();

	// Get period description
	const periodDescription = $derived(() => {
		const startDate = formatDate(selectedDate);

		if (selectedPeriod === 'day') {
			return startDate;
		} else if (selectedPeriod === 'week') {
			const endDate = formatDate(new Date(selectedDate.getTime() + 6 * 24 * 60 * 60 * 1000));
			return `${startDate} to ${endDate}`;
		} else {
			const endDate = formatDate(
				new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
			);
			return `${startDate} to ${endDate}`;
		}
	});
</script>

<svelte:head>
	<title>Export Transactions - Family Finance Tracker</title>
</svelte:head>

<div class="relative min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
	<!-- Professional Header Section -->
	<div class="relative overflow-hidden">
		<!-- Background Pattern -->
		<div class="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700"></div>
		<div class="absolute inset-0 bg-black/10"></div>
		<div
			class="absolute inset-0"
			style="background-image: radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)"
		></div>

		<div class="relative px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
			<div class="flex flex-col">
				<div class="mb-6 flex items-center space-x-3">
					<div class="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
						<svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					</div>
					<div>
						<h1 class="text-3xl font-bold text-white sm:text-4xl">Export Transactions</h1>
						<p class="mt-1 text-base text-purple-100 opacity-90 sm:text-lg">
							Download your family's transaction data in CSV format
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Content Section -->
	<div class="container mx-auto px-4 py-8 pb-24 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-2xl">
			{#if error}
				<Card class="mb-6 border-red-200 bg-red-50">
					<div class="p-4">
						<div class="flex items-start">
							<div class="flex-shrink-0">
								<svg class="mt-0.5 h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
							<div class="ml-3">
								<h3 class="text-sm font-medium text-red-800">Export Error</h3>
								<div class="mt-1 text-sm text-red-700">{error}</div>
							</div>
						</div>
					</div>
				</Card>
			{/if}

			<!-- Export Configuration Card -->
			<Card class="border bg-white p-6 shadow-sm sm:p-8">
				<div class="space-y-6">
					<!-- Period Selection -->
					<div class="space-y-2">
						<label for="period-select" class="block text-sm font-medium text-gray-700">
							Export Period
						</label>
						<select
							id="period-select"
							bind:value={selectedPeriod}
							class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none sm:text-sm"
						>
							<option value="day">Single Day</option>
							<option value="week">Week</option>
							<option value="month">Month</option>
						</select>
						<p class="text-xs text-gray-500">Choose the time period for your transaction export</p>
					</div>

					<!-- Date Selection -->
					<div class="space-y-2">
						<label for="date-input" class="block text-sm font-medium text-gray-700">
							{selectedPeriod === 'day'
								? 'Select Date'
								: selectedPeriod === 'week'
									? 'Week Starting Date'
									: 'Month Starting Date'}
						</label>
						<input
							id="date-input"
							type="date"
							bind:value={dateInputValue}
							oninput={handleDateChange}
							class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none sm:text-sm"
							max={new Date().toISOString().split('T')[0]}
						/>
						<p class="text-xs text-gray-500">
							Select the {selectedPeriod === 'day' ? 'date' : 'starting date'} for your export
						</p>
					</div>

					<!-- Transaction Type -->
					<div class="space-y-2">
						<label for="type-select" class="block text-sm font-medium text-gray-700">
							Transaction Type
						</label>
						<select
							id="type-select"
							bind:value={selectedType}
							class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none sm:text-sm"
						>
							<option value="all">All Transactions</option>
							<option value="income">Income Only</option>
							<option value="expense">Expenses Only</option>
						</select>
						<p class="text-xs text-gray-500">Filter transactions by type for your export</p>
					</div>

					<!-- Export Button -->
					<div class="pt-2">
						<button
							onclick={handleExport}
							disabled={isLoading || (remainingExports !== null && remainingExports <= 0)}
							class="w-full rounded-md bg-purple-600 px-4 py-3 text-base font-medium text-white shadow-sm transition-colors duration-200 hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#if isLoading}
								<div class="flex items-center justify-center">
									<Spinner size="sm" class="mr-3" />
									<span>Generating CSV...</span>
								</div>
							{:else}
								<div class="flex items-center justify-center">
									<svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
									<span>Download CSV Export</span>
								</div>
							{/if}
						</button>
					</div>

					<!-- Rate Limit Info -->
					{#if remainingExports !== null}
						<div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-3">
									<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
										<svg class="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
											<path
												fill-rule="evenodd"
												d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
												clip-rule="evenodd"
											/>
										</svg>
									</div>
									<div>
										<p class="text-sm font-medium text-gray-900">Daily Export Limit</p>
										<p class="text-xs text-gray-600">Resets every 24 hours</p>
									</div>
								</div>
								<div class="text-right">
									<p class="text-lg font-bold text-gray-900">
										{remainingExports}<span class="text-sm font-normal text-gray-500">/10</span>
									</p>
									<p class="text-xs text-gray-600">Remaining today</p>
								</div>
							</div>

							<!-- Progress bar -->
							<div class="mt-3">
								<div class="h-2 rounded-full bg-gray-200">
									<div
										class="h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
										style="width: {(remainingExports / 10) * 100}%"
									></div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</Card>

			<!-- Additional Info Card -->
			<Card class="mt-6 border border-blue-200 bg-blue-50 p-6">
				<div class="flex items-start space-x-4">
					<div class="flex-shrink-0">
						<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
							<svg
								class="h-5 w-5 text-blue-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
					</div>
					<div>
						<h3 class="mb-2 text-lg font-semibold text-gray-900">Export Information</h3>
						<div class="space-y-1 text-sm text-gray-700">
							<p>
								• CSV files include all transaction details: date, amount, category, description,
								and family member
							</p>
							<p>• Exports are limited to 10 per day to ensure system performance</p>
							<p>• Files are generated in real-time and include the most current data</p>
							<p>• Date ranges are inclusive of start and end dates</p>
						</div>
					</div>
				</div>
			</Card>
		</div>
	</div>
</div>

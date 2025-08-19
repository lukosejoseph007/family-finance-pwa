<script lang="ts">
  import Spinner from '$lib/components/ui/Spinner.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import Input from '$lib/components/ui/Input.svelte';

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
          'Content-Type': 'application/json',
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
  function handleDateChange(value: string) {
    selectedDate = new Date(value);
  }

  // Check rate limit on component mount
  checkRateLimit();
</script>

<Card class="max-w-md mx-auto p-6">
  <h1 class="text-2xl font-bold mb-6 text-gray-800">Export Transactions</h1>
  
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
      {error}
    </div>
  {/if}

  <div class="space-y-6">
    <!-- Period Selection -->
    <div>
      <label for="period-select" class="block text-sm font-medium mb-2 text-gray-700">Export Period</label>
      <Select
        id="period-select"
        bind:value={selectedPeriod}
        options={[
          { value: 'day', label: 'Single Day' },
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' }
        ]}
        class="w-full"
      />
    </div>

    <!-- Date Selection -->
    <div>
      <label for="date-input" class="block text-sm font-medium mb-2 text-gray-700">
        {selectedPeriod === 'day' ? 'Select Date' : 
         selectedPeriod === 'week' ? 'Start of Week' : 'Start of Month'}
      </label>
      <Input
        id="date-input"
        type="date"
        value={dateInputValue}
        on:input={(e) => handleDateChange(e.target?.value || '')}
        class="w-full"
        max={new Date().toISOString().split('T')[0]}
      />
    </div>

    <!-- Transaction Type -->
    <div>
      <label for="type-select" class="block text-sm font-medium mb-2 text-gray-700">Transaction Type</label>
      <Select
        id="type-select"
        bind:value={selectedType}
        options={[
          { value: 'all', label: 'All Transactions' },
          { value: 'income', label: 'Income Only' },
          { value: 'expense', label: 'Expenses Only' }
        ]}
        class="w-full"
      />
    </div>

    <!-- Export Button -->
    <Button
      on:click={handleExport}
      disabled={isLoading || (remainingExports !== null && remainingExports <= 0)}
      class="w-full"
      variant="primary"
    >
      {#if isLoading}
        <Spinner size="sm" class="mr-2" />
        Generating CSV...
      {:else}
        Download CSV
      {/if}
    </Button>

    <!-- Preview and Rate Limit -->
    <div class="text-sm text-gray-600 space-y-2">
      <p>Exporting: <span class="font-medium">{selectedType}</span> transactions for</p>
      <p class="font-medium">
        {formatDate(selectedDate)} 
        {selectedPeriod === 'week' ? ' to ' + formatDate(new Date(selectedDate.getTime() + 6 * 24 * 60 * 60 * 1000)) : 
         selectedPeriod === 'month' ? ' to ' + formatDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)) : ''}
      </p>
      
      {#if remainingExports !== null}
        <div class="mt-3 p-2 bg-gray-50 rounded">
          <p class="text-xs text-gray-500">Exports remaining today: <span class="font-semibold">{remainingExports}/10</span></p>
        </div>
      {/if}
    </div>
  </div>
</Card>
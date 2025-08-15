<script lang="ts">
	export let value: number | string = '';
	export let label = '';
	export let placeholder = '0.00';
	export let currency = '₹';
	export let disabled = false;
	export let required = false;
	export let error = '';
	export let id = '';
	export let name = '';
	export let min: number | undefined = undefined;
	export let max: number | undefined = undefined;

	let className = '';
	export { className as class };

	let displayValue = '';
	let isFocused = false;
	
	const uniqueId = id || `currency-${Math.random().toString(36).substr(2, 9)}`;

	// Format display value when not focused
	$: if (!isFocused && value !== '') {
		const numValue = typeof value === 'string' ? parseFloat(value) : value;
		if (!isNaN(numValue)) {
			displayValue = formatCurrency(numValue);
		} else {
			displayValue = '';
		}
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-IN', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(amount);
	}

	function handleFocus() {
		isFocused = true;
		// Show raw numeric value when focused
		const numValue = typeof value === 'string' ? parseFloat(value) : value;
		displayValue = isNaN(numValue) ? '' : numValue.toString();
	}

	function handleBlur() {
		isFocused = false;
		// Parse and validate the input
		const numValue = parseFloat(displayValue);
		if (!isNaN(numValue)) {
			value = numValue;
		} else {
			value = '';
			displayValue = '';
		}
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		displayValue = target.value;
		
		// Update the bound value in real-time when focused
		if (isFocused) {
			const numValue = parseFloat(target.value);
			value = isNaN(numValue) ? '' : numValue;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		// Allow: backspace, delete, tab, escape, enter
		if ([8, 9, 27, 13, 46].indexOf(event.keyCode) !== -1 ||
			// Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
			(event.keyCode === 65 && event.ctrlKey === true) ||
			(event.keyCode === 67 && event.ctrlKey === true) ||
			(event.keyCode === 86 && event.ctrlKey === true) ||
			(event.keyCode === 88 && event.ctrlKey === true) ||
			// Allow: home, end, left, right
			(event.keyCode >= 35 && event.keyCode <= 39)) {
			return;
		}
		// Ensure that it is a number and stop the keypress
		if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && 
			(event.keyCode < 96 || event.keyCode > 105) && 
			event.keyCode !== 190 && event.keyCode !== 110) {
			event.preventDefault();
		}
	}
</script>

<div class="w-full {className}">
	{#if label}
		<label for={uniqueId} class="block text-sm font-medium text-gray-700 mb-1">
			{label}
			{#if required}<span class="text-red-500">*</span>{/if}
		</label>
	{/if}
	
	<div class="relative">
		<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
			<span class="text-gray-500 text-sm">{currency}</span>
		</div>
		
		<input
			{id}
			{name}
			type="text"
			bind:value={displayValue}
			{placeholder}
			{disabled}
			{required}
			{min}
			{max}
			class="block w-full rounded-lg border-gray-300 pl-8 pr-3 py-2 text-sm shadow-sm
				focus:border-blue-500 focus:ring-1 focus:ring-blue-500
				disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
				{error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}"
			on:focus={handleFocus}
			on:blur={handleBlur}
			on:input={handleInput}
			on:keydown={handleKeydown}
			aria-describedby={error ? `${uniqueId}-error` : undefined}
		/>
	</div>
	
	{#if error}
		<p id="{uniqueId}-error" class="mt-1 text-sm text-red-600">
			{error}
		</p>
	{/if}
</div>
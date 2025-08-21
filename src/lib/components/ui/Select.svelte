<script lang="ts">
	interface Option {
		value: string;
		label: string;
		disabled?: boolean;
	}

	export let value = '';
	export let options: Option[] = [];
	export let label = '';
	export let placeholder = 'Select an option';
	export let disabled = false;
	export let required = false;
	export let error = '';
	export let id = '';
	export let name = '';

	let className = '';
	export { className as class };

	const uniqueId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
</script>

<div class="w-full space-y-1 {className}">
	{#if label}
		<label for={uniqueId} class="mb-2 block text-sm font-semibold text-gray-700">
			{label}
			{#if required}<span class="text-red-500">*</span>{/if}
		</label>
	{/if}

	<select
		{id}
		{name}
		bind:value
		{disabled}
		{required}
		class="block w-full rounded-xl border px-4 py-3 text-sm backdrop-blur-sm transition-all duration-200
			focus:ring-2 focus:ring-offset-1 focus:outline-none
			{error
			? 'border-red-200/50 bg-red-50/30 text-red-800 focus:border-red-400/60 focus:ring-red-400/30'
			: 'border-white/30 bg-white/40 text-gray-800 focus:border-blue-400/60 focus:ring-blue-400/30'}
			{disabled ? 'cursor-not-allowed bg-gray-100/30 text-gray-500 opacity-50' : ''}
			{$$props.class || ''}"
		aria-describedby={error ? `${uniqueId}-error` : undefined}
	>
		{#if placeholder}
			<option value="" disabled selected={!value}>{placeholder}</option>
		{/if}

		{#each options as option}
			<option value={option.value} disabled={option.disabled}>
				{option.label}
			</option>
		{/each}
	</select>

	{#if error}
		<p id="{uniqueId}-error" class="mt-1 text-sm text-red-600">
			{error}
		</p>
	{/if}
</div>

<script lang="ts">
	export let type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' = 'text';
	export let value: string | number = '';
	export let placeholder = '';
	export let label = '';
	export let error = '';
	export let disabled = false;
	export let required = false;
	export let id = '';
	export let name = '';
	export let autocomplete: string | undefined = undefined;

	let className = '';
	export { className as class };

	$: inputClasses = [
		'block w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1',
		error
			? 'border-red-300 text-red-900 placeholder-red-400 focus:border-red-500 focus:ring-red-500'
			: 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500',
		disabled ? 'bg-gray-50 cursor-not-allowed opacity-50' : 'bg-white',
		className
	]
		.filter(Boolean)
		.join(' ');

	$: labelClasses = [
		'block text-sm font-medium mb-1',
		error ? 'text-red-700' : 'text-gray-700'
	].join(' ');
</script>

<div class="space-y-1">
	{#if label}
		<label for={id} class={labelClasses}>
			{label}
			{#if required}
				<span class="text-red-500">*</span>
			{/if}
		</label>
	{/if}

	<input
		{type}
		{id}
		{name}
		{placeholder}
		{disabled}
		{required}
		autocomplete={autocomplete as any}
		class={inputClasses}
		bind:value
		on:input
		on:change
		on:focus
		on:blur
		on:keydown
		on:keyup
	/>

	{#if error}
		<p class="text-sm text-red-600">{error}</p>
	{/if}
</div>

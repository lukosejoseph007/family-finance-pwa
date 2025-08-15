<script lang="ts">
	export let type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' = 'text';
	export let value: string | number = '';
	export let placeholder = '';
	export let label = '';
	export let error = '';
	export let disabled = false;
	export let required = false;
	export let id = '';
	export let name = '';
	export let autocomplete: string | undefined = undefined;
	export let step: string | number | undefined = undefined;

	let className = '';
	export { className as class };

	$: inputClasses = [
		'block w-full rounded-xl border px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 backdrop-blur-sm',
		error
			? 'border-red-200/50 text-red-800 placeholder-red-400/70 focus:border-red-400/60 focus:ring-red-400/30 bg-red-50/30'
			: 'border-white/30 text-gray-800 placeholder-gray-500/70 focus:border-blue-400/60 focus:ring-blue-400/30 bg-white/40',
		disabled ? 'bg-gray-100/30 cursor-not-allowed opacity-50' : '',
		className
	]
		.filter(Boolean)
		.join(' ');

	$: labelClasses = [
		'block text-sm font-semibold mb-2',
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
		{step}
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

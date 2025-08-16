<script lang="ts">
	let {
		type = 'text',
		value = $bindable(''),
		placeholder = '',
		label = '',
		error = '',
		disabled = false,
		required = false,
		id = '',
		name = '',
		autocomplete = undefined,
		step = undefined,
		class: className = '',
		...restProps
	}: {
		type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date';
		value?: string | number;
		placeholder?: string;
		label?: string;
		error?: string;
		disabled?: boolean;
		required?: boolean;
		id?: string;
		name?: string;
		autocomplete?: string;
		step?: string | number;
		class?: string;
		[key: string]: any;
	} = $props();

	const inputClasses = $derived([
		'block w-full rounded-xl border px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 backdrop-blur-sm',
		error
			? 'border-red-200/50 text-red-800 placeholder-red-400/70 focus:border-red-400/60 focus:ring-red-400/30 bg-red-50/30'
			: 'border-white/30 text-gray-800 placeholder-gray-500/70 focus:border-blue-400/60 focus:ring-blue-400/30 bg-white/40',
		disabled ? 'bg-gray-100/30 cursor-not-allowed opacity-50' : '',
		className
	]
		.filter(Boolean)
		.join(' '));

	const labelClasses = $derived([
		'block text-sm font-semibold mb-2',
		error ? 'text-red-700' : 'text-gray-700'
	].join(' '));
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
		{...restProps}
	/>

	{#if error}
		<p class="text-sm text-red-600">{error}</p>
	{/if}
</div>

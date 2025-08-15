<script lang="ts">
	type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
	type Size = 'sm' | 'md' | 'lg';

	export let variant: Variant = 'default';
	export let size: Size = 'md';
	export let rounded = true;
	export let removable = false;

	let className = '';
	export { className as class };

	const variants = {
		default: 'bg-gray-100/60 backdrop-blur-sm text-gray-800 border border-gray-200/50',
		success: 'bg-green-100/60 backdrop-blur-sm text-green-800 border border-green-200/50',
		warning: 'bg-yellow-100/60 backdrop-blur-sm text-yellow-800 border border-yellow-200/50',
		danger: 'bg-red-100/60 backdrop-blur-sm text-red-800 border border-red-200/50',
		info: 'bg-blue-100/60 backdrop-blur-sm text-blue-800 border border-blue-200/50',
		secondary: 'bg-indigo-100/60 backdrop-blur-sm text-indigo-800 border border-indigo-200/50'
	};

	const sizes = {
		sm: 'px-3 py-1.5 text-xs',
		md: 'px-4 py-2 text-sm',
		lg: 'px-5 py-2.5 text-base'
	};

	function handleRemove() {
		if (removable) {
			// Dispatch remove event
			const event = new CustomEvent('remove');
			dispatchEvent(event);
		}
	}
</script>

<span
	class="inline-flex items-center font-medium
		{variants[variant]}
		{sizes[size]}
		{rounded ? 'rounded-full' : 'rounded'}
		{className}"
>
	<slot />
	
	{#if removable}
		<button
			type="button"
			class="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-current hover:bg-current hover:bg-opacity-30 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current"
			on:click={handleRemove}
			aria-label="Remove"
		>
			<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
				<path
					fill-rule="evenodd"
					d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
					clip-rule="evenodd"
				/>
			</svg>
		</button>
	{/if}
</span>
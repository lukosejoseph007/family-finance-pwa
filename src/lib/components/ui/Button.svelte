<script lang="ts">
	export let variant: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' = 'primary';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let disabled = false;
	export let loading = false;
	export let fullWidth = false;
	export let type: 'button' | 'submit' | 'reset' = 'button';

	let className = '';
	export { className as class };

	$: buttonClasses = [
		'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',

		// Size variants
		size === 'sm'
			? 'px-3 py-1.5 text-sm'
			: size === 'lg'
				? 'px-6 py-3 text-lg'
				: 'px-4 py-2 text-base', // md

		// Color variants
		variant === 'primary'
			? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
			: variant === 'secondary'
				? 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500'
				: variant === 'danger'
					? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
					: variant === 'success'
						? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
						: variant === 'outline'
							? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
							: '',

		// Width
		fullWidth ? 'w-full' : '',

		// Additional classes
		className
	]
		.filter(Boolean)
		.join(' ');
</script>

<button {type} class={buttonClasses} {disabled} on:click on:focus on:blur>
	{#if loading}
		<svg
			class="mr-2 -ml-1 h-4 w-4 animate-spin"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
		>
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
			></circle>
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
		</svg>
	{/if}
	<slot />
</button>

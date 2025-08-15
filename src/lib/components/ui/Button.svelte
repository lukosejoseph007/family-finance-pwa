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
		'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95',

		// Size variants
		size === 'sm'
			? 'px-3 py-2 text-sm'
			: size === 'lg'
				? 'px-6 py-3.5 text-lg'
				: 'px-4 py-2.5 text-base', // md

		// Color variants with glassmorphism
		variant === 'primary'
			? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 focus:ring-blue-500 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 backdrop-blur-sm border border-white/20'
			: variant === 'secondary'
				? 'bg-white/60 text-gray-700 hover:bg-white/80 focus:ring-gray-500 backdrop-blur-sm border border-white/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10'
				: variant === 'danger'
					? 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 focus:ring-red-500 shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40 backdrop-blur-sm border border-white/20'
					: variant === 'success'
						? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 focus:ring-green-500 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/40 backdrop-blur-sm border border-white/20'
						: variant === 'outline'
							? 'border border-gray-300/60 bg-white/40 text-gray-700 hover:bg-white/60 focus:ring-blue-500 backdrop-blur-sm shadow-sm hover:shadow-md hover:shadow-black/5'
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

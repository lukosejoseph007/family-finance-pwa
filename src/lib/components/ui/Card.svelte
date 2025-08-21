<script lang="ts">
	export let title = '';
	export let subtitle = '';
	export let padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
	export let shadow: 'none' | 'sm' | 'md' | 'lg' = 'md';
	export let border = true;
	export let hover = false;

	let className = '';
	export { className as class };

	$: cardClasses = [
		'bg-white/70 backdrop-blur-xl rounded-2xl transition-all duration-300',

		// Padding variants
		padding === 'none' ? '' : padding === 'sm' ? 'p-4' : padding === 'lg' ? 'p-8' : 'p-6', // md

		// Shadow variants with glassmorphism
		shadow === 'none'
			? ''
			: shadow === 'sm'
				? 'shadow-lg shadow-black/5'
				: shadow === 'lg'
					? 'shadow-2xl shadow-black/10'
					: 'shadow-xl shadow-black/8', // md

		// Border with glassmorphism
		border ? 'border border-white/30' : '',

		// Hover effect with glassmorphism
		hover
			? 'hover:shadow-2xl hover:shadow-black/10 hover:scale-[1.02] hover:bg-white/80 cursor-pointer'
			: '',

		className
	]
		.filter(Boolean)
		.join(' ');

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			(event.currentTarget as HTMLDivElement).click();
		}
	}
</script>

<div class={cardClasses} on:click on:keydown={handleKeyDown} role="button" tabindex="0">
	{#if title || subtitle || $$slots.header}
		<div class="mb-6 {padding === 'none' ? 'p-6 pb-0' : ''}">
			<slot name="header">
				{#if title}
					<h3 class="text-lg font-semibold text-gray-800">{title}</h3>
				{/if}
				{#if subtitle}
					<p class="mt-2 text-sm text-gray-600/80">{subtitle}</p>
				{/if}
			</slot>
		</div>
	{/if}

	<div class={padding === 'none' ? 'p-6 pt-0' : ''}>
		<slot />
	</div>

	{#if $$slots.footer}
		<div class="mt-6 border-t border-white/30 pt-4 {padding === 'none' ? 'p-6 pt-4' : ''}">
			<slot name="footer" />
		</div>
	{/if}
</div>

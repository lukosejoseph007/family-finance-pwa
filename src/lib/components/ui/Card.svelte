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
		'bg-white rounded-lg transition-all',

		// Padding variants
		padding === 'none' ? '' : padding === 'sm' ? 'p-4' : padding === 'lg' ? 'p-8' : 'p-6', // md

		// Shadow variants
		shadow === 'none'
			? ''
			: shadow === 'sm'
				? 'shadow-sm'
				: shadow === 'lg'
					? 'shadow-lg'
					: 'shadow-md', // md

		// Border
		border ? 'border border-gray-200' : '',

		// Hover effect
		hover ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer' : '',

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
					<h3 class="text-lg font-semibold text-gray-900">{title}</h3>
				{/if}
				{#if subtitle}
					<p class="mt-2 text-sm text-gray-600">{subtitle}</p>
				{/if}
			</slot>
		</div>
	{/if}

	<div class={padding === 'none' ? 'p-6 pt-0' : ''}>
		<slot />
	</div>

	{#if $$slots.footer}
		<div class="mt-6 border-t border-gray-200 pt-4 {padding === 'none' ? 'p-6 pt-4' : ''}">
			<slot name="footer" />
		</div>
	{/if}
</div>

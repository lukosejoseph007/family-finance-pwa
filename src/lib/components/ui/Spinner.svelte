<script lang="ts">
	type Size = 'sm' | 'md' | 'lg' | 'xl';
	type Color = 'blue' | 'gray' | 'green' | 'red' | 'yellow' | 'indigo';

	export let size: Size = 'md';
	export let color: Color = 'blue';
	export let centered = false;

	let className = '';
	export { className as class };

	const sizes = {
		sm: 'h-4 w-4',
		md: 'h-6 w-6',
		lg: 'h-8 w-8',
		xl: 'h-12 w-12'
	};

	const colors = {
		blue: 'border-blue-500',
		gray: 'border-gray-500',
		green: 'border-green-500',
		red: 'border-red-500',
		yellow: 'border-yellow-500',
		indigo: 'border-indigo-500'
	};
</script>

<div class="{centered ? 'flex items-center justify-center' : ''} {className}">
	<div
		class="animate-spin rounded-full border-2 border-t-transparent backdrop-blur-sm {sizes[
			size
		]} {colors[color]} drop-shadow-sm"
		role="status"
		aria-label="Loading"
	>
		<span class="sr-only">Loading...</span>
	</div>
</div>

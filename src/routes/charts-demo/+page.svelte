<script>
	import { onMount } from 'svelte';

	let FinanceChart;

	onMount(async () => {
		const module = await import('$lib/components/charts/FinanceChart.svelte');
		FinanceChart = module.default;
	});
</script>

<h1>Charts Demo (Lazy Loaded)</h1>

{#if FinanceChart}
	<svelte:component this={FinanceChart} />
{:else}
	<p>Loading chart...</p>
{/if}

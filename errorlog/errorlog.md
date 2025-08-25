[plugin:vite-plugin-svelte:compile] src/lib/components/charts/LineChart.svelte:63:1 `{@const}` must be the immediate child of `{#snippet}`, `{#if}`, `{:else if}`, `{:else}`, `{#each}`, `{:then}`, `{:catch}`, `<svelte:fragment>`, `<svelte:boundary` or `<Component>`
https://svelte.dev/e/const_tag_invalid_placement
LineChart.svelte:63:1
61 |    {/if}
 62 |    
 63 |    {@const safeData = chartData()}
                                        ^
 64 |    {#if safeData.length === 0}
 65 |      <div class="flex h-full items-center justify-center">
Click outside, press Esc key, or fix the code to dismiss.
You can also disable this overlay by setting server.hmr.overlay to false in vite.config.ts.
<script lang="ts">
	export let headers: string[] = [];
	export let sortable = false;
	export let striped = true;
	export let hoverable = true;
	export let bordered = false;
	export let compact = false;

	let className = '';
	export { className as class };

	let sortColumn = '';
	let sortDirection: 'asc' | 'desc' = 'asc';

	function handleSort(column: string) {
		if (!sortable) return;
		
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}
</script>

<div class="overflow-x-auto backdrop-blur-xl bg-white/70 rounded-2xl border border-white/30 shadow-lg {className}">
	<table class="min-w-full divide-y divide-white/20 {bordered ? 'border border-white/30' : ''}">
		{#if headers.length > 0}
			<thead class="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm">
				<tr>
					{#each headers as header, index}
						<th
							class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider
								{sortable ? 'cursor-pointer hover:bg-white/20 transition-colors duration-200' : ''}
								{compact ? 'px-3 py-2' : ''}"
							on:click={() => handleSort(header)}
						>
							<div class="flex items-center space-x-1">
								<span>{header}</span>
								{#if sortable}
									<span class="text-gray-400">
										{#if sortColumn === header}
											{sortDirection === 'asc' ? '↑' : '↓'}
										{:else}
											↕
										{/if}
									</span>
								{/if}
							</div>
						</th>
					{/each}
				</tr>
			</thead>
		{/if}
		
		<tbody class="bg-white/30 backdrop-blur-sm divide-y divide-white/20 {striped ? '[&>tr:nth-child(even)]:bg-white/40' : ''} {hoverable ? '[&>tr:hover]:bg-white/50 [&>tr]:transition-colors [&>tr]:duration-200' : ''}">
			<slot {sortColumn} {sortDirection} />
		</tbody>
	</table>
</div>
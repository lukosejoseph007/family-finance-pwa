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

<div
	class="overflow-x-auto rounded-2xl border border-white/30 bg-white/70 shadow-lg backdrop-blur-xl {className}"
>
	<table class="min-w-full divide-y divide-white/20 {bordered ? 'border border-white/30' : ''}">
		{#if headers.length > 0}
			<thead class="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm">
				<tr>
					{#each headers as header, index}
						<th
							class="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase
								{sortable ? 'cursor-pointer transition-colors duration-200 hover:bg-white/20' : ''}
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

		<tbody
			class="divide-y divide-white/20 bg-white/30 backdrop-blur-sm {striped
				? '[&>tr:nth-child(even)]:bg-white/40'
				: ''} {hoverable
				? '[&>tr]:transition-colors [&>tr]:duration-200 [&>tr:hover]:bg-white/50'
				: ''}"
		>
			<slot {sortColumn} {sortDirection} />
		</tbody>
	</table>
</div>

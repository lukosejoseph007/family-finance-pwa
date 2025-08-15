<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let open = false;
	export let title = '';
	export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
	export let closable = true;
	export let backdrop = true;

	const dispatch = createEventDispatcher();

	function closeModal() {
		if (closable) {
			open = false;
			dispatch('close');
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (backdrop && event.target === event.currentTarget) {
			closeModal();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && closable) {
			closeModal();
		}
	}

	$: modalClasses = [
		'fixed inset-0 z-50 flex items-center justify-center p-4',
		open ? 'visible' : 'invisible'
	].join(' ');

	$: contentClasses = [
		'bg-white rounded-lg shadow-xl transform transition-all',
		size === 'sm'
			? 'max-w-sm w-full'
			: size === 'lg'
				? 'max-w-2xl w-full'
				: size === 'xl'
					? 'max-w-4xl w-full'
					: 'max-w-lg w-full', // md
		open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
	].join(' ');
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
	<div class={modalClasses} on:click={handleBackdropClick} on:keydown={handleKeydown} role="dialog" aria-modal="true" tabindex="-1">
		<!-- Backdrop -->
		<div class="bg-opacity-50 fixed inset-0 bg-black transition-opacity"></div>

		<!-- Modal content -->
		<div class={contentClasses}>
			<!-- Header -->
			{#if title || closable || $$slots.header}
				<div class="flex items-center justify-between border-b border-gray-200 p-6">
					<slot name="header">
						{#if title}
							<h2 class="text-xl font-semibold text-gray-900">{title}</h2>
						{/if}
					</slot>

					{#if closable}
						<button
							type="button"
							class="text-gray-400 transition-colors hover:text-gray-600"
							on:click={closeModal}
							aria-label="Close"
						>
							<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					{/if}
				</div>
			{/if}

			<!-- Body -->
			<div class="p-6">
				<slot />
			</div>

			<!-- Footer -->
			{#if $$slots.footer}
				<div class="flex justify-end gap-3 border-t border-gray-200 p-6">
					<slot name="footer" />
				</div>
			{/if}
		</div>
	</div>
{/if}

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
		'bg-white/80 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/20 border border-white/30 transform transition-all duration-300',
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
		<!-- Backdrop with glassmorphism -->
		<div class="bg-black/40 backdrop-blur-sm fixed inset-0 transition-opacity duration-300"></div>

		<!-- Modal content -->
		<div class={contentClasses}>
			<!-- Header -->
			{#if title || closable || $$slots.header}
				<div class="flex items-center justify-between border-b border-white/30 p-6">
					<slot name="header">
						{#if title}
							<h2 class="text-xl font-semibold text-gray-800">{title}</h2>
						{/if}
					</slot>

					{#if closable}
						<button
							type="button"
							class="text-gray-500 hover:text-gray-700 p-2 rounded-xl bg-white/40 hover:bg-white/60 backdrop-blur-sm transition-all duration-200"
							on:click={closeModal}
							aria-label="Close"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
				<div class="flex justify-end gap-3 border-t border-white/30 p-6 bg-white/20 backdrop-blur-sm rounded-b-2xl">
					<slot name="footer" />
				</div>
			{/if}
		</div>
	</div>
{/if}

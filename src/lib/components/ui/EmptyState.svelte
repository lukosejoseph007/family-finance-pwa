<script lang="ts">
	import { Button } from '$lib/components';

	type Variant = 'default' | 'chart' | 'transactions' | 'budget' | 'insights';
	type Size = 'small' | 'medium' | 'large';

	let {
		icon = '📊',
		title = 'No data available',
		description = 'Start tracking to see insights here.',
		actionText = '',
		actionHref = '',
		onAction = undefined,
		variant = 'default' as Variant,
		size = 'medium' as Size
	} = $props<{
		icon?: string;
		title?: string;
		description?: string;
		actionText?: string;
		actionHref?: string;
		onAction?: () => void;
		variant?: Variant;
		size?: Size;
	}>();

	const variants: Record<Variant, {
		bgGradient: string;
		iconBg: string;
		iconColor: string;
		titleColor: string;
		descColor: string;
	}> = {
		default: {
			bgGradient: 'from-gray-50 to-gray-100',
			iconBg: 'bg-gray-100',
			iconColor: 'text-gray-600',
			titleColor: 'text-gray-900',
			descColor: 'text-gray-600'
		},
		chart: {
			bgGradient: 'from-blue-50 to-indigo-50',
			iconBg: 'bg-blue-100',
			iconColor: 'text-blue-600',
			titleColor: 'text-blue-900',
			descColor: 'text-blue-700'
		},
		transactions: {
			bgGradient: 'from-green-50 to-emerald-50',
			iconBg: 'bg-green-100',
			iconColor: 'text-green-600',
			titleColor: 'text-green-900',
			descColor: 'text-green-700'
		},
		budget: {
			bgGradient: 'from-purple-50 to-violet-50',
			iconBg: 'bg-purple-100',
			iconColor: 'text-purple-600',
			titleColor: 'text-purple-900',
			descColor: 'text-purple-700'
		},
		insights: {
			bgGradient: 'from-amber-50 to-orange-50',
			iconBg: 'bg-amber-100',
			iconColor: 'text-amber-600',
			titleColor: 'text-amber-900',
			descColor: 'text-amber-700'
		}
	};

	const sizes: Record<Size, {
		container: string;
		iconContainer: string;
		iconText: string;
		title: string;
		description: string;
		maxWidth: string;
	}> = {
		small: {
			container: 'py-8 px-6',
			iconContainer: 'h-12 w-12 mb-4',
			iconText: 'text-2xl',
			title: 'text-lg',
			description: 'text-sm',
			maxWidth: 'max-w-xs'
		},
		medium: {
			container: 'py-12 px-8',
			iconContainer: 'h-16 w-16 mb-6',
			iconText: 'text-3xl',
			title: 'text-xl',
			description: 'text-base',
			maxWidth: 'max-w-sm'
		},
		large: {
			container: 'py-16 px-12',
			iconContainer: 'h-20 w-20 mb-8',
			iconText: 'text-4xl',
			title: 'text-2xl',
			description: 'text-lg',
			maxWidth: 'max-w-md'
		}
	};

	const currentVariant = variants[variant as Variant];
	const currentSize = sizes[size as Size];
</script>

<div
	class="flex flex-col items-center justify-center text-center rounded-2xl bg-gradient-to-br {currentVariant.bgGradient} {currentSize.container}"
>
	<div class="{currentSize.maxWidth} mx-auto">
		<!-- Icon -->
		<div
			class="mx-auto flex items-center justify-center rounded-2xl {currentVariant.iconBg} {currentSize.iconContainer} shadow-sm"
		>
			<span class="{currentSize.iconText}">{icon}</span>
		</div>

		<!-- Content -->
		<h3 class="font-bold {currentVariant.titleColor} {currentSize.title} mb-3">
			{title}
		</h3>
		
		<p class="{currentVariant.descColor} {currentSize.description} leading-relaxed mb-6">
			{description}
		</p>

		<!-- Action -->
		{#if actionText}
			<div class="space-y-2">
				{#if actionHref}
					<a
						href={actionHref}
						class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
					>
						{actionText}
					</a>
				{:else if onAction}
					<Button on:click={onAction} size="sm" class="shadow-md hover:shadow-lg transition-shadow">
						{actionText}
					</Button>
				{/if}
			</div>
		{/if}

	</div>
</div>

<style>
	/* Add subtle animation */
	div:first-child {
		animation: fadeInUp 0.6s ease-out;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
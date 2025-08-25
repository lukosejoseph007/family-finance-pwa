<script lang="ts">
	let {
		value = 0,
		max = 100,
		size = 120,
		strokeWidth = 8,
		color = '#3b82f6',
		backgroundColor = '#e5e7eb',
		label = '',
		showValue = true,
		animated = true,
		duration = 1000
	} = $props<{
		value?: number;
		max?: number;
		size?: number;
		strokeWidth?: number;
		color?: string;
		backgroundColor?: string;
		label?: string;
		showValue?: boolean;
		animated?: boolean;
		duration?: number;
	}>();

	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	
	const percentage = $derived(Math.min(Math.max((value / max) * 100, 0), 100));
	const strokeDasharray = $derived(circumference);
	const strokeDashoffset = $derived(circumference - (percentage / 100) * circumference);
	
	// Color variations based on percentage
	const ringColor = $derived(typeof color === 'string' ? color : getColorByPercentage(percentage));
	
	function getColorByPercentage(percent: number): string {
		if (percent >= 80) return '#ef4444'; // red
		if (percent >= 60) return '#f59e0b'; // yellow
		return '#10b981'; // green
	}
</script>

<div class="relative inline-flex items-center justify-center" style="width: {size}px; height: {size}px;">
	<svg 
		width={size} 
		height={size} 
		class="transform -rotate-90"
		viewBox="0 0 {size} {size}"
	>
		<!-- Background circle -->
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			stroke={backgroundColor}
			stroke-width={strokeWidth}
			fill="none"
			class="opacity-20"
		/>
		<!-- Progress circle -->
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			stroke={ringColor}
			stroke-width={strokeWidth}
			fill="none"
			stroke-linecap="round"
			stroke-dasharray={strokeDasharray}
			stroke-dashoffset={strokeDashoffset}
			class="transition-all ease-out"
			style="transition-duration: {animated ? duration : 0}ms;"
		/>
	</svg>
	
	<!-- Center content -->
	<div class="absolute inset-0 flex flex-col items-center justify-center text-center">
		{#if showValue}
			<div class="text-2xl font-bold text-gray-900" style="color: {ringColor};">
				{Math.round(percentage)}%
			</div>
		{/if}
		{#if label}
			<div class="text-xs text-gray-600 font-medium mt-1 max-w-[80px] leading-tight">
				{label}
			</div>
		{/if}
	</div>
</div>

<style>
	svg circle {
		transition-property: stroke-dashoffset, stroke;
	}
</style>
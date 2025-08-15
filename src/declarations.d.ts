// Custom type declarations for @inlang/paraglide-js

declare module '@inlang/paraglide-js/server' {
	export function paraglideMiddleware(
		request: Request,
		callback: (args: { request: Request; locale: string }) => Response | Promise<Response>
	): Response | Promise<Response>;
}

declare module '@inlang/paraglide-js/runtime' {
	export function deLocalizeUrl(url: string): { pathname: string };
}

// Chart types
import type { ChartData, ChartOptions, TooltipItem } from 'chart.js';

export type ChartType = 'line' | 'bar' | 'doughnut';

export type FinanceChartData = ChartData & {
	// You can add any specific properties for your chart data here
};

export type FinanceChartOptions = ChartOptions & {
	cutout?: string;
	plugins?: {
		legend?: {
			position?: 'top' | 'bottom' | 'left' | 'right';
		};
	};
};

export type TooltipLabelContext = TooltipItem<ChartType>;

declare module 'layerchart' {
  import { SvelteComponent } from 'svelte';
  
  // Core Components
  export class Chart extends SvelteComponent {}
  export class LayerCake extends SvelteComponent {}
  
  // Chart Types
  export class Line extends SvelteComponent {}
  export class Area extends SvelteComponent {}
  export class Bar extends SvelteComponent {}
  export class ColumnChart extends SvelteComponent {}
  export class Pie extends SvelteComponent {}
  export class Arc extends SvelteComponent {}
  export class Spline extends SvelteComponent {}
  export class Scatter extends SvelteComponent {}
  export class MultiLine extends SvelteComponent {}
  export class StackedArea extends SvelteComponent {}
  export class StackedBar extends SvelteComponent {}
  
  // Axes and Guides
  export class AxisX extends SvelteComponent {}
  export class AxisY extends SvelteComponent {}
  export class Grid extends SvelteComponent {}
  export class Baseline extends SvelteComponent {}
  export class RuleX extends SvelteComponent {}
  export class RuleY extends SvelteComponent {}
  
  // Interactive Components
  export class Tooltip extends SvelteComponent {}
  export class Crosshair extends SvelteComponent {}
  export class Brush extends SvelteComponent {}
  export class Zoom extends SvelteComponent {}
  export class Pan extends SvelteComponent {}
  export class Highlight extends SvelteComponent {}
  
  // Annotations
  export class Text extends SvelteComponent {}
  export class Points extends SvelteComponent {}
  export class Labels extends SvelteComponent {}
  export class Legend extends SvelteComponent {}
  
  // Layouts
  export class Group extends SvelteComponent {}
  export class Threshold extends SvelteComponent {}
  
  // Transformations
  export const scaleBand: (domain?: string[]) => (value: string) => number;
  export const scaleLinear: (domain?: number[], range?: number[]) => (value: number) => number;
  export const scaleTime: (domain?: Date[], range?: number[]) => (value: Date) => number;
  export const scaleOrdinal: (domain?: string[], range?: string[]) => (value: string) => string;
  
  // Utilities
  export const motionPreferences: { reducedMotion: boolean };
  export const format: (specifier: string) => (value: number) => string;
  export const extent: (data: number[]) => [number, number];
  export const stack: (keys: string[]) => (data: Record<string, number>[]) => Record<string, number>[][];
  export const bin: () => (data: number[]) => Array<{ x0: number; x1: number; length: number }>;
}

declare module 'layerchart/utils' {
  export function createData(data: Record<string, unknown>[]): Record<string, unknown>[];
  export function formatValue(value: number, currency?: string): string;
  export function getColorScale(colors: string[]): (index: number) => string;
  export function processTimeSeriesData(data: Record<string, unknown>[]): Record<string, unknown>[];
}
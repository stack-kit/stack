<!--
	The legend of a pattern chart. Render it after the chart container, so that it sits in the
	normal flow under the chart and never in the chart padding: a legend that wraps pushes the
	content under it down, and it never covers an axis or the donut. It renders the LayerChart
	Legend with the context that the chart binds, and draws each item through the `children`
	snippet: the tile of the category and the label, in a button with aria-pressed. The first click
	on an item shows only that category, and each further click adds or removes one category. A
	pointer over an item highlights its category on the chart. A chart that labels each category on
	the chart has no legend.
-->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';
	import type { ChartState } from 'layerchart';
	import type { Category, ChartStyle } from './patterns.js';

	/** @behaviour toggle-series highlight-series */
	export type PatternLegendProps<T> = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'prefix' | 'style'> & {
		ref?: HTMLDivElement | null;
		/** The context that the chart binds. */
		context: ChartState<T>;
		/** The prefix of the patterns of the chart, from patternPrefix($props.id()). */
		prefix: string;
		/** The categories of the chart, in pattern order. */
		categories: Category[];
		style?: ChartStyle;
	};
</script>

<script lang="ts" generics="T">
	import { untrack } from 'svelte';
	import { Legend, setChartContext } from 'layerchart';
	import { cn } from '#lib/utils.js';
	import PatternTile from './PatternTile.svelte';

	let { context, prefix, categories, style = 'pattern', class: className, ref = $bindable(null), ...rest }: PatternLegendProps<T> = $props();

	// The chart binds one context for its lifetime, so the first value is the only one.
	setChartContext(untrack(() => context));

	function shown(key: string): boolean {
		const selected = context.series.selectedKeys.current;
		return selected.length === 0 || selected.includes(key);
	}
</script>

<div bind:this={ref} data-slot="pattern-legend" data-pattern-legend={prefix} class={cn('mt-2', className)} {...rest}>
	<!-- The items come from the categories of the part, in pattern order, so that tile n is the pattern
	     of category n. LayerChart gives the series keys only when a series has a color, and else the
	     values of its color scale. -->
	<Legend class="block">
		{#snippet children()}
			<div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
				{#each categories as category, i (category.key)}
					<button
						type="button"
						class={[
							'flex items-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 max-md:min-h-11',
							shown(category.key) ? 'text-foreground' : 'text-muted-foreground [&_svg]:opacity-30'
						]}
						aria-pressed={shown(category.key)}
						data-key={category.key}
						onclick={() => context.series.selectedKeys.toggle(category.key)}
						onpointerenter={() => (context.series.highlightKey = category.key)}
						onpointerleave={() => (context.series.highlightKey = null)}
					>
						<PatternTile {prefix} n={i + 1} {style} />
						{category.label}
					</button>
				{/each}
			</div>
		{/snippet}
	</Legend>
</div>

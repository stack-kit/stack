<!--
	The legend of a pattern chart. Render it after the chart container, so that it sits in the
	normal flow under the chart and never in the chart padding: a legend that wraps pushes the
	content under it down, and it never covers an axis or the donut. It renders the LayerChart
	Legend with the context that the chart binds, and draws each item through the `children`
	snippet: the tile of the category and the label, in a button with aria-pressed. The first click
	on an item shows only that category, and each further click adds or removes one category. A
	chart that labels each category on the chart has no legend.
-->
<script lang="ts" generics="T">
	import { untrack } from 'svelte';
	import { Legend, setChartContext, type ChartState } from 'layerchart';
	import PatternTile from './PatternTile.svelte';
	import type { Category, ChartStyle } from './patterns.js';

	let {
		context,
		prefix,
		categories,
		style = 'pattern'
	}: {
		context: ChartState<T>;
		prefix: string;
		categories: Category[];
		style?: ChartStyle;
	} = $props();

	// The chart binds one context for its lifetime, so the first value is the only one.
	setChartContext(untrack(() => context));

	const position = $derived(new Map(categories.map((c, i) => [c.key, i])));

	function shown(key: string): boolean {
		const selected = context.series.selectedKeys.current;
		return selected.length === 0 || selected.includes(key);
	}
</script>

<Legend class="mt-2 block" data-pattern-legend={prefix}>
	{#snippet children({ seriesItems, values })}
		{@const keys = seriesItems ? seriesItems.map((s) => s.key) : values.map(String)}
		<div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
			{#each keys as key (key)}
				{@const i = position.get(key)}
				{#if i !== undefined}
					<button
						type="button"
						class={[
							'flex items-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 max-md:min-h-11',
							shown(key) ? 'text-foreground' : 'text-muted-foreground [&_svg]:opacity-30'
						]}
						aria-pressed={shown(key)}
						data-key={key}
						onclick={() => context.series.selectedKeys.toggle(key)}
						onpointerenter={() => (context.series.highlightKey = key)}
						onpointerleave={() => (context.series.highlightKey = null)}
					>
						<PatternTile {prefix} n={i + 1} {style} />
						{categories[i].label}
					</button>
				{/if}
			{/each}
		</div>
	{/snippet}
</Legend>

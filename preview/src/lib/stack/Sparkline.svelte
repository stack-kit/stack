<!--
	A sparkline: the shape of one metric over time, in a row of a list or a table or beside a figure
	(DESIGN.md, `### Sparkline`). It is the line of category 1: 2 px, in chart-ink in the pattern style
	and in chart-1 in the two color styles. It has no axis, no grid, no labels, no tooltip and no data
	table. Its domain runs from its lowest to its highest value, because it shows the shape of the change
	and no value is read from it. A flat series draws across the middle. Its value stands beside it as
	text, which the product writes. Its accessible name states the metric, the period and the first and
	the last value: the box has the img role, so a screen reader reads that name and nothing inside it.
	The chart renders on the client only, on the SVG layer, in a box of fixed size.
-->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';
	import type { ChartStyle } from './patterns.js';

	/** @behaviour print:fit-column */
	export type SparklineProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'class' | 'style'> & {
		ref?: HTMLSpanElement | null;
		/** The values in time order, oldest first. */
		values: number[];
		/** The accessible name: the metric, the period, and the first and the last value. */
		label: string;
		style?: ChartStyle;
		/** The size of the box, which needs a fixed width and height, and the place of the part, such as a margin. */
		class?: string;
	};
</script>

<script lang="ts">
	import { LineChart } from 'layerchart/svg';
	import type { ChartState } from 'layerchart';
	import * as Chart from '#lib/components/ui/chart/index.js';
	import { registerChart } from '#lib/print/chart-width.js';
	import { cn } from '#lib/utils.js';
	import { CHART_INK, chartColor, lineLook, markProps } from './patterns.js';

	// The default stays the size of v1.0.0, and the root holds the same size, so a class that only
	// places the part keeps the size of 80 by 24 px. The chart fills the root.
	let { values, label, style = 'pattern', class: className = 'h-6 w-20', ref = $bindable(null), ...rest }: SparklineProps = $props();

	// The context stays undefined until the chart mounts. The type of the LayerChart prop leaves undefined
	// out, so each bind:context takes "!", which only satisfies that type.
	let context = $state<ChartState>();
	$effect(() => (context ? registerChart(context) : undefined));

	const data = $derived(values.map((value, i) => ({ i, value })));
	const low = $derived(Math.min(...values));
	const high = $derived(Math.max(...values));
	const series = $derived([
		{ key: 'value', value: 'value', color: style === 'pattern' ? CHART_INK : chartColor(1), props: markProps(lineLook(style, 1)) }
	]);
	const config = { value: { label: 'Value' } } satisfies Chart.ChartConfig;
</script>

<span
	bind:this={ref}
	role="img"
	aria-label={label}
	data-slot="sparkline"
	data-sparkline
	data-chart-style={style}
	class={cn('inline-flex h-6 w-20 shrink-0 align-middle', className)}
	{...rest}
>
	<Chart.Container {config} class="size-full">
		<LineChart
			bind:context={context!}
			{data}
			x="i"
			{series}
			yDomain={high === low ? [low - 1, low + 1] : [low, high]}
			yNice={false}
			axis={false}
			grid={false}
			rule={false}
			highlight={false}
			tooltipContext={false}
			padding={{ top: 2, bottom: 2, left: 1, right: 1 }}
			props={{ svg: { 'aria-hidden': 'true' } }}
		/>
	</Chart.Container>
</span>

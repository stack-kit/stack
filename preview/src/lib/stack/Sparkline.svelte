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
<script lang="ts">
	import { LineChart } from 'layerchart/svg';
	import type { ChartState } from 'layerchart';
	import * as Chart from '#lib/components/ui/chart/index.js';
	import { registerChart } from '#lib/print/chart-width.js';
	import { CHART_INK, chartColor, lineLook, markProps, type ChartStyle } from './patterns.js';

	let {
		values,
		label,
		style = 'pattern',
		class: className = 'h-6 w-20'
	}: {
		/** The values in time order, oldest first. */
		values: number[];
		/** The accessible name: the metric, the period, and the first and the last value. */
		label: string;
		style?: ChartStyle;
		/** The size of the box. It needs a fixed width and height. */
		class?: string;
	} = $props();

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

<span role="img" aria-label={label} class="inline-flex shrink-0 align-middle" data-sparkline data-chart-style={style}>
	<Chart.Container {config} class={className}>
		<LineChart
			bind:context
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

<!--
	A chart in the pattern style, the default, in the color pattern style or in the color style.
	- kind "bar": one bar for each category, with the value above each bar.
	- kind "stacked-bar" and "stacked-area": the categories stacked over the x values, with a legend
	  when they hold two or more categories, and the total above each bar. A stacked bar of one
	  category is a bar over time, such as the spend of each day: its caption names the metric, so it
	  has no legend. When the names of the x values do not fit under the bars, the axis names every
	  nth x value, by the rule of "A long category axis" in DESIGN.md.
	- When the value of any bar is wider than its bar, only the tallest bar shows its value, by the
	  rule of "Values that do not fit" in DESIGN.md.
	- kind "donut": one slice for each category, with a leader line to an outside label (the name
	  and the value), and the total in the center.
	The pattern style fills category n with pattern-n: marks in chart-ink on the ground under the
	chart. The color pattern style draws the same marks in chart-n, and the color style fills it with
	chart-n. In every style a 1 px edge in the ground keeps two shapes apart. The value axis has three ticks: 0, the middle and the maximum.
	- The patterns sit in a 0 by 0 svg of this chart, under a prefix from $props.id().
	- A legend, when the chart has one, sits in the normal flow under the chart.
	- The tooltip names the category in text, and its marker is the tile of the category.
	- The svg has a title, and aria-describedby points to the summary and to the data table.
	  The table is visually hidden until the button under the chart shows it. The labels on the
	  chart are hidden from a screen reader, because the table holds the same values.
	The chart renders on the client only, on the SVG layer, in a container of fixed height.
-->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Category, ChartGround, ChartStyle } from './patterns.js';

	type Row = Record<string, string | number | Date>;
	type Kind = 'bar' | 'stacked-bar' | 'stacked-area' | 'donut';

	/** @behaviour print:fit-column */
	export type PatternChartProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'class' | 'style' | 'title'> & {
		/** The root, the figure of the chart. */
		ref?: HTMLElement | null;
		kind: Kind;
		/** The pattern style is the default. A product or a person may take one of the two color styles. */
		style?: ChartStyle;
		/** The ground under the chart. Every style draws its 1 px gaps in it. */
		ground?: ChartGround;
		/** The name of the chart: the caption, the svg title and the table caption. */
		title: string;
		/** One or two sentences that state what the chart shows. */
		summary: string;
		/** The categories in pattern order. */
		categories: Category[];
		/** Bar and donut: one row per category, { key, value }. Stacked: one row per x value, with a number per category key. */
		data: Row[];
		/** Stacked: the key of the x value. */
		x?: string;
		/** Stacked: the key of the text that heads each table row, and the heading of that column. */
		rowHeader?: string;
		rowHeaderLabel?: string;
		/** Bar and donut: the heading of the value column of the table. */
		valueLabel?: string;
		/** Donut: the word under the total. */
		totalLabel?: string;
		/** The text of a value: on the chart, on the axis, in the tooltip and in the table. */
		format?: (value: number) => string;
		/** Stacked: the short name of an x value on the axis, such as 19 Oct. With none, the axis shows the x value. */
		tick?: (value: string | number | Date) => string;
		/** Classes for the root, which place the part, such as a margin, a grid cell or a width. A height class, such as h-80, sets the height of the chart container. */
		class?: string;
	};
</script>

<script lang="ts">
	import { AreaChart, BarChart, PieChart } from 'layerchart/svg';
	import type { ChartState, Tooltip } from 'layerchart';
	import * as Chart from '#lib/components/ui/chart/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import { registerChart } from '#lib/print/chart-width.js';
	import { cn } from '#lib/utils.js';
	import { placeOf, sizeOf } from './chart-class.js';
	import StackPatternDefs from './StackPatternDefs.svelte';
	import PatternLegend from './PatternLegend.svelte';
	import PatternTile from './PatternTile.svelte';
	import { CHART_INK, categoryFill, chartColor, groundColor, patternPrefix, threeTicks } from './patterns.js';

	let {
		kind,
		style = 'pattern',
		ground = 'background',
		title,
		summary,
		categories,
		data,
		x = 'key',
		rowHeader = x,
		rowHeaderLabel = '',
		valueLabel = 'Value',
		totalLabel = 'total',
		format = (v: number) => v.toLocaleString('en'),
		tick,
		class: className = 'h-64 w-full',
		ref = $bindable(null),
		...rest
	}: PatternChartProps = $props();

	const uid = $props.id();
	const prefix = patternPrefix(uid);
	const summaryId = `${prefix}-summary`;
	const tableId = `${prefix}-table`;

	// The context stays undefined until the chart mounts. The type of the LayerChart prop leaves undefined
	// out, so each bind:context takes "!", which only satisfies that type.
	let context = $state<ChartState<Row>>();
	$effect(() => (context ? registerChart(context) : undefined));
	let container = $state<HTMLElement | null>(null);
	let tableShown = $state(false);

	// A fallback font has other widths than the web font, so the texts are measured again when the fonts load.
	let fontsLoaded = $state(false);
	$effect(() => {
		document.fonts.ready.then(() => (fontsLoaded = true));
	});

	/**
	 * The width of the widest text in the font of the container at a weight. It reads the width of the
	 * chart and the font state, so that the texts are measured again when the text step changes and
	 * when the web font replaces the fallback.
	 */
	function widest(texts: string[], weight: 400 | 500): number {
		void fontsLoaded;
		if (!container || !context?.width) return 0;
		const pen = document.createElement('canvas').getContext('2d');
		if (!pen) return 0;
		const font = getComputedStyle(container);
		pen.font = `${weight} ${font.fontSize} ${font.fontFamily}`;
		return Math.max(0, ...texts.map((t) => pen.measureText(t).width));
	}

	const stacked = $derived(kind === 'stacked-bar' || kind === 'stacked-area');
	const position = $derived(new Map(categories.map((c, i) => [c.key, i])));
	const fill = (key: unknown) => categoryFill(style, prefix, (position.get(String(key)) ?? 0) + 1);
	const label = (key: unknown) => categories[position.get(String(key)) ?? 0]?.label ?? String(key);

	const config = $derived(
		Object.fromEntries(
			categories.map((c, i) => [c.key, { label: c.label, color: chartColor(i + 1) }])
		) satisfies Chart.ChartConfig
	);

	// LayerChart spreads the props of a series onto every mark of it, the top line of an area
	// too. So a series carries its fill only, and the edges are set once per chart below.
	const series = $derived(
		categories.map((c, i) => ({
			key: c.key,
			label: c.label,
			color: chartColor(i + 1),
			props: { fill: categoryFill(style, prefix, i + 1), fillOpacity: 1 }
		}))
	);

	const slices = $derived(data.map((d) => ({ ...d, props: { fill: fill(d.key) } })));

	// The sum of each row: the value of a bar, or the height of a stack.
	const rowTotal = (row: Row, keys: string[]) =>
		stacked ? keys.reduce((s, k) => s + Number(row[k] ?? 0), 0) : Number(row.value ?? 0);
	const allKeys = $derived(categories.map((c) => c.key));
	const ticks = $derived(threeTicks(Math.max(0, ...data.map((row) => rowTotal(row, allKeys)))));
	const total = $derived(data.reduce((s, d) => s + Number(d.value ?? 0), 0));

	// Every style edges each shape 1 px in the ground under the chart: a thin gap between two
	// neighbours, so that two shapes that meet stay apart.
	const edge = $derived({ stroke: groundColor(ground), strokeWidth: 1 });

	const svg = $derived({ title, 'aria-describedby': `${summaryId} ${tableId}` });
	const yAxis = $derived({ ticks, format });
	const grid = $derived({ yTicks: ticks });

	// "A long category axis" in DESIGN.md: on a band axis LayerChart 2.7.0 names every x value, so the
	// axis of a stacked bar names every nth x value, where n is the smallest step for which n times the
	// distance from one bar to the next is at least the widest name plus 8 px. The first x value always
	// has its name. The tooltip and the data table name every x value.
	const NAME_STEPS = [1, 2, 3, 4, 6, 12];
	const NAME_GAP = 8;
	const xTicks = $derived.by(() => {
		if (kind !== 'stacked-bar' || data.length < 2 || !context) return undefined;
		const values = data.map((row) => row[x]).filter((v) => v !== undefined);
		const [first, second] = values;
		if (first === undefined || second === undefined) return undefined;
		const step = Math.abs(Number(context.xScale(second)) - Number(context.xScale(first)));
		const name = widest(values.map((v) => (tick ? tick(v) : String(v))), 400);
		if (!step || !name) return undefined;
		const n = NAME_STEPS.find((k) => k * step >= name + NAME_GAP) ?? 12;
		return values.filter((_, i) => i % n === 0);
	});
	const xAxis = $derived(
		kind === 'bar' ? { format: label } : { ...(xTicks ? { ticks: xTicks } : {}), ...(tick ? { format: tick } : {}) }
	);

	// The donut leaves room around the ring for the outside labels.
	const DONUT_PAD = { top: 28, bottom: 28, left: 96, right: 96 };
	const LEADER_OUT = 12; // the radial part of a leader line, from the ring out
	const LEADER_SIDE = 16; // the part to the side, toward the label, at the height of the bend
	const LABEL_GAP = 4; // from the end of the leader line to the label
	const LABEL_LINE = 15; // from the baseline of the name to the baseline of the value
	const LABEL_STEP = 34; // the least distance between two labels on one side: two lines of 16 px and 2 px
	const LABEL_ROOM = 24; // from the end of a leader line to the far edge of its label

	type Placed = { key: string; x0: number; y0: number; x1: number; y1: number; x2: number; y: number; side: 1 | -1 };

	/**
	 * The leader lines and the label places of a donut. The slices follow the data order from 12
	 * o'clock, clockwise, as the pie draws them with no sort. A label grows away from the ring: in the
	 * upper half the leader line ends at the value and the name sits above it, and in the lower half
	 * the leader line ends at the name. Labels on one side move apart along y until each is
	 * LABEL_STEP from the next, and stay inside the container. A label stands on the circle of radius
	 * r + LEADER_OUT + LEADER_SIDE at its height, so a label that moves never covers the ring, and the
	 * leader lines of one side keep their order and never cross.
	 */
	function donutLabels(width: number, height: number): Placed[] {
		const r = Math.min(width, height) / 2;
		const sum = data.reduce((s, d) => s + Number(d.value), 0);
		let angle = 0;
		const placed: Placed[] = data.map((d) => {
			const start = angle;
			angle += (Number(d.value) / sum) * 2 * Math.PI;
			const mid = (start + angle) / 2;
			const [sin, cos] = [Math.sin(mid), -Math.cos(mid)];
			const side = sin >= 0 ? 1 : -1;
			const x1 = sin * (r + LEADER_OUT);
			const y1 = cos * (r + LEADER_OUT);
			return { key: String(d.key), x0: sin * r, y0: cos * r, x1, y1, x2: 0, y: y1, side };
		});
		const labelRadius = r + LEADER_OUT + LEADER_SIDE;
		const top = -height / 2 - DONUT_PAD.top + LABEL_ROOM;
		const bottom = height / 2 + DONUT_PAD.bottom - LABEL_ROOM;
		for (const side of [1, -1]) {
			const column = placed.filter((p) => p.side === side).sort((a, b) => a.y - b.y);
			column.forEach((p, i) => {
				p.y = Math.max(p.y, top, i ? column[i - 1]!.y + LABEL_STEP : top);
			});
			for (let i = column.length - 1; i >= 0; i--) {
				const limit = i === column.length - 1 ? bottom : column[i + 1]!.y - LABEL_STEP;
				column[i]!.y = Math.min(column[i]!.y, limit);
			}
		}
		for (const p of placed) p.x2 = p.side * Math.sqrt(Math.max(0, labelRadius ** 2 - p.y ** 2));
		return placed;
	}

	// The tooltip of a stacked chart is headed by the same text as the table row.
	function rowLabel(value: unknown): string {
		const same = (v: unknown) => (v instanceof Date ? v.getTime() : v);
		return String(data.find((row) => same(row[x]) === same(value))?.[rowHeader] ?? value);
	}
</script>

{#snippet tooltipRow({ item }: { item: Tooltip.TooltipSeries })}
	<!-- A bar chart has one series, so the row takes its category from the bar under the pointer. -->
	{@const key = kind === 'bar' ? String((context?.tooltip.data as Row | null)?.key ?? '') : item.key}
	{@const i = position.get(key)}
	{#if i !== undefined}
		<span class="flex shrink-0"><PatternTile {prefix} n={i + 1} {style} /></span>
		<div class="flex flex-1 items-center justify-between gap-2 leading-none">
			<span class="text-muted-foreground">{categories[i]!.label}</span>
			<span class="font-medium text-foreground tabular-nums">{format(Number(item.value))}</span>
		</div>
	{/if}
{/snippet}

{#snippet baseLine({ context: c }: { context: ChartState<Row> })}
	<line
		x1={c.xRange[0]}
		x2={c.xRange[1]}
		y1={c.yScale(0)}
		y2={c.yScale(0)}
		class="stroke-border"
		stroke-width="1"
		data-chart-base-line
	/>
{/snippet}

<!-- "Values that do not fit" in DESIGN.md: when the value of any bar is wider than its bar, only the
     tallest bar shows its value, the first of them when two are equally tall. -->
{#snippet barValues({ context: c }: { context: ChartState<Row> })}
	{@const shown = c.series.visibleSeries.map((s) => s.key)}
	{@const band = c.xScale.bandwidth?.() ?? 0}
	{@const totals = data.map((row) => rowTotal(row, shown))}
	{@const fit = widest(totals.map(format), 500) <= band}
	{@const tallest = totals.indexOf(Math.max(...totals))}
	<g aria-hidden="true" data-chart-values>
		{#each data as row, r (r)}
			{#if fit || r === tallest}
				<text
					x={Number(c.xScale(row[x])) + band / 2}
					y={c.yScale(totals[r] ?? 0) - 6}
					text-anchor="middle"
					class="fill-foreground text-xs font-medium tabular-nums">{format(totals[r] ?? 0)}</text
				>
			{/if}
		{/each}
	</g>
{/snippet}

{#snippet donutMarks({ context: c }: { context: ChartState<Row> })}
	<g aria-hidden="true" data-chart-labels>
		{#each donutLabels(c.width, c.height) as p (p.key)}
			{@const row = data.find((d) => String(d.key) === p.key)}
			<path
				d="M{p.x0},{p.y0}L{p.x1},{p.y1}L{p.x2},{p.y}"
				fill="none"
				stroke={CHART_INK}
				stroke-width="1"
				data-chart-leader={p.key}
			/>
			<text
				x={p.x2 + p.side * LABEL_GAP}
				y={p.y + 4 - (p.y < 0 ? LABEL_LINE : 0)}
				text-anchor={p.side > 0 ? 'start' : 'end'}
				class="text-xs"
				data-chart-label={p.key}
			>
				<tspan class="fill-foreground font-medium">{label(p.key)}</tspan>
				<tspan
					x={p.x2 + p.side * LABEL_GAP}
					dy={LABEL_LINE}
					class="fill-muted-foreground tabular-nums">{format(Number(row?.value ?? 0))}</tspan
				>
			</text>
		{/each}
		<text text-anchor="middle" y="4" class="fill-foreground text-3xl font-semibold tabular-nums" data-chart-total
			>{format(total)}</text
		>
		<text text-anchor="middle" y="22" class="fill-muted-foreground text-xs">{totalLabel}</text>
	</g>
{/snippet}

<figure
	bind:this={ref}
	data-slot="pattern-chart"
	data-pattern-chart={kind}
	data-chart-style={style}
	class={cn('m-0 flex min-w-0 flex-col gap-1', placeOf(className))}
	{...rest}
>
	<figcaption class="text-sm font-medium">{title}</figcaption>
	<p id={summaryId} class="text-xs text-muted-foreground">{summary}</p>
	{#if style !== 'color'}<StackPatternDefs {prefix} {style} />{/if}
	<Chart.Container {config} class={[cn('h-64 w-full', sizeOf(className)), '[&_.lc-area-line]:fill-none']} bind:ref={container}>
		{#if kind === 'bar'}
			<BarChart
				{data}
				x="key"
				y="value"
				c="key"
				cRange={data.map((d) => fill(d.key))}
				yDomain={[0, ticks[2]]}
				yNice={false}
				rule={false}
				padding={{ top: 20, bottom: 20, left: 32, right: 4 }}
				bind:context={context!}
				props={{ svg, bars: edge, yAxis, grid, xAxis }}
				belowMarks={baseLine}
				aboveMarks={barValues}
			>
				{#snippet tooltip()}
					<Chart.Tooltip hideLabel formatter={tooltipRow} />
				{/snippet}
			</BarChart>
		{:else if kind === 'stacked-bar'}
			<BarChart
				{data}
				{x}
				{series}
				seriesLayout="stack"
				yDomain={[0, ticks[2]]}
				yNice={false}
				rule={false}
				padding={{ top: 20, bottom: 20, left: 32, right: 4 }}
				bind:context={context!}
				props={{ svg, bars: edge, yAxis, grid, xAxis }}
				belowMarks={baseLine}
				aboveMarks={barValues}
			>
				{#snippet tooltip()}
					<Chart.Tooltip labelFormatter={rowLabel} formatter={tooltipRow} />
				{/snippet}
			</BarChart>
		{:else if kind === 'stacked-area'}
			<AreaChart
				{data}
				{x}
				{series}
				seriesLayout="stack"
				yDomain={[0, ticks[2]]}
				yNice={false}
				rule={false}
				padding={{ top: 8, bottom: 20, left: 32, right: 4 }}
				bind:context={context!}
				props={{ svg, line: edge, yAxis, grid, xAxis }}
				belowMarks={baseLine}
			>
				{#snippet tooltip()}
					<Chart.Tooltip labelFormatter={rowLabel} formatter={tooltipRow} />
				{/snippet}
			</AreaChart>
		{:else}
			<PieChart
				data={slices}
				key="key"
				value="value"
				cRange={data.map((d) => fill(d.key))}
				innerRadius={0.6}
				padding={DONUT_PAD}
				bind:context={context!}
				props={{ svg, arc: edge, pie: { sort: null } }}
				aboveMarks={donutMarks}
			>
				{#snippet tooltip()}<Chart.Tooltip hideLabel formatter={tooltipRow} />{/snippet}
			</PieChart>
		{/if}
	</Chart.Container>
	<!-- A chart with one category has no legend: its caption names the metric ("Labels on the chart"). -->
	{#if context && stacked && categories.length > 1}
		<PatternLegend {context} {prefix} {categories} {style} />
	{/if}
	<div>
		<Button
			variant="outline"
			size="sm"
			class="mt-2 print:hidden"
			aria-expanded={tableShown}
			aria-controls={tableId}
			onclick={() => (tableShown = !tableShown)}
			>{tableShown ? 'Hide' : 'Show'} the data as a table</Button
		>
	</div>
	<!-- A table does not shrink to the 1 px box of sr-only, so a wrapper hides it. -->
	<div class={tableShown ? 'mt-2' : 'sr-only'}>
		<Table.Root id={tableId}>
			<Table.Caption class="text-left text-xs">{title}</Table.Caption>
			{#if !stacked}
				<Table.Header>
					<Table.Row>
						<Table.Head scope="col">Category</Table.Head>
						<Table.Head scope="col" class="text-right">{valueLabel}</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data as row (row.key)}
						<Table.Row>
							<Table.Head scope="row" class="h-auto p-2 font-normal">{label(row.key)}</Table.Head>
							<Table.Cell class="text-right tabular-nums">{format(Number(row.value))}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			{:else}
				<Table.Header>
					<Table.Row>
						<Table.Head scope="col">{rowHeaderLabel}</Table.Head>
						{#each categories as c (c.key)}
							<Table.Head scope="col" class="text-right">{c.label}</Table.Head>
						{/each}
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data as row, r (r)}
						<Table.Row>
							<Table.Head scope="row" class="h-auto p-2 font-normal">{row[rowHeader]}</Table.Head>
							{#each categories as c (c.key)}
								<Table.Cell class="text-right tabular-nums">{format(Number(row[c.key]))}</Table.Cell>
							{/each}
						</Table.Row>
					{/each}
				</Table.Body>
			{/if}
		</Table.Root>
	</div>
</figure>

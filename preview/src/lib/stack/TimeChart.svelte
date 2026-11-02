<!--
	A chart of one or two metrics over time (DESIGN.md, `### Line chart`).
	- kind "line": line 1 is solid and line 2 is dotted in every style, in chart-ink in the pattern style
	  and in chart-n in the two color styles. Each line of a chart with two
	  metrics names itself at its right end. A chart with one metric names it in its caption, so no line
	  chart has a legend.
	- kind "area": one metric, filled with pattern-1, or chart-1 in the color style. Its top line is the
	  line of category 1, because one area has no neighbour that a gap in the ground keeps apart.
	- comparison: the previous period over the same x values, a dashed line in muted-foreground in every
	  style, named at its right end, and the change as text above the plot.
	- references: up to four named lines at a value, a crisp 1 px line in muted-foreground across the
	  plot with a 1 px edge in the ground at each side, and the name and the value at its right end.
	- annotations: up to nine numbered marks on the time axis, under the base line, each with a 1 px
	  guide in border up through the plot, and their texts in a list under the chart and in the table.
	The guides and the reference lines lie over the fill of an area and under every line.
	The labels at the right end stand at least 16 px apart, and the plot leaves room at its right for
	the widest of them. The time axis names every day when the names fit, and else the first day and
	the first day of each week, by the rule of "A long category axis". The first name starts at the
	origin, and the plot leaves half the widest name at its right for the name of the last x value.
	The chart renders on the client only, on the SVG layer, in a container of fixed height.
-->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Category, ChartGround, ChartStyle } from './patterns.js';

	type Row = Record<string, number | Date>;
	/** A named line at a value, such as a target or a threshold. */
	type Reference = { label: string; value: number };
	/** An event on the time axis. `at` is the x value of a row of the data. */
	type Annotation = { at: Date; text: string };
	/**
	 * The previous period: the key of its values in each row, its name at the right end of its line,
	 * the value of each whole period as the product counts it, and the period in words for the change.
	 */
	type Comparison = { key: string; label: string; current: number; previous: number; period: string };

	/** @behaviour print:fit-column */
	export type TimeChartProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'class' | 'style' | 'title'> & {
		/** The root, the figure of the chart. */
		ref?: HTMLElement | null;
		kind?: 'line' | 'area';
		/** The pattern style is the default. A product or a person may take one of the two color styles. */
		style?: ChartStyle;
		/** The ground under the chart. A reference line has a 1 px edge in it at each side. */
		ground?: ChartGround;
		/** The name of the chart: the caption, the svg title and the table caption. It names the metric. */
		title: string;
		/** One or two sentences that state what the chart shows. */
		summary: string;
		/** One or two metrics with one unit. An area and a chart with a comparison hold one. */
		metrics: Category[];
		/** One row per x value, oldest first, with a number per metric key and the comparison key. */
		data: Row[];
		/** The key of the x value, a Date. */
		x?: string;
		comparison?: Comparison;
		references?: Reference[];
		annotations?: Annotation[];
		/** The heading of the column of x values in the table. */
		rowHeaderLabel?: string;
		/** The text of a value: on the axis, at a reference line, in the tooltip and in the table. */
		format?: (value: number) => string;
		/** The text of an x value: on the axis, in the tooltip, in the list and in the table. */
		dateFormat?: (date: Date) => string;
		/** Classes for the root, which place the part, such as a margin, a grid cell or a width. A height class, such as h-80, sets the height of the chart container. */
		class?: string;
	};
</script>

<script lang="ts">
	import { Area, AreaChart, LineChart, Spline, Text } from 'layerchart/svg';
	import type { ChartState, TextProps, Tooltip } from 'layerchart';
	import { innerWidth } from 'svelte/reactivity/window';
	import * as Chart from '#lib/components/ui/chart/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import { registerChart } from '#lib/print/chart-width.js';
	import { cn } from '#lib/utils.js';
	import { placeOf, sizeOf } from './chart-class.js';
	import StackPatternDefs from './StackPatternDefs.svelte';
	import LineTile from './LineTile.svelte';
	import {
		CHART_INK,
		COMPARISON_LOOK,
		MAX_ANNOTATIONS,
		MAX_REFERENCES,
		REFERENCE_STROKE,
		categoryFill,
		chartColor,
		groundColor,
		lineLook,
		markProps,
		patternPrefix,
		threeTicks,
		type LineLook
	} from './patterns.js';

	let {
		kind = 'line',
		style = 'pattern',
		ground = 'background',
		title,
		summary,
		metrics,
		data,
		x = 'date',
		comparison,
		references = [],
		annotations = [],
		rowHeaderLabel = 'Day',
		format = (v: number) => v.toLocaleString('en'),
		dateFormat = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
		class: className = 'h-64 w-full',
		ref = $bindable(null),
		...rest
	}: TimeChartProps = $props();

	// The limits of DESIGN.md, checked once at the boundary.
	$effect.pre(() => {
		if (metrics.length < 1 || metrics.length > 2) throw new Error(`TimeChart "${title}": a line chart holds one or two metrics, and it has ${metrics.length}.`);
		if ((kind === 'area' || comparison) && metrics.length > 1) throw new Error(`TimeChart "${title}": an area and a chart with a comparison hold one metric. Draw two metrics as two lines.`);
		if (kind === 'area' && comparison) throw new Error(`TimeChart "${title}": an area takes no comparison, because the area hides the line under it. Take kind "line".`);
		if (references.length > MAX_REFERENCES) throw new Error(`TimeChart "${title}": a chart holds up to ${MAX_REFERENCES} reference lines, and it has ${references.length}.`);
		if (annotations.length > MAX_ANNOTATIONS) throw new Error(`TimeChart "${title}": a chart holds up to ${MAX_ANNOTATIONS} annotations, so that each number has one digit, and it has ${annotations.length}.`);
		const missing = annotations.find((a) => !data.some((row) => sameTime(row[x], a.at)));
		if (missing) throw new Error(`TimeChart "${title}": the annotation "${missing.text}" is at ${missing.at.toISOString()}, which is no x value of the data. Put it on the x value of a row, so that the table holds it.`);
	});

	const uid = $props.id();
	const prefix = patternPrefix(uid);
	const summaryId = `${prefix}-summary`;
	const changeId = `${prefix}-change`;
	const tableId = `${prefix}-table`;
	const referenceTableId = `${prefix}-references`;

	// The context stays undefined until the chart mounts. The type of the LayerChart prop leaves undefined
	// out, so each bind:context takes "!", which only satisfies that type.
	let context = $state<ChartState<Row>>();
	$effect(() => (context ? registerChart(context) : undefined));
	let container = $state<HTMLElement | null>(null);
	let tableShown = $state(false);

	function sameTime(a: unknown, b: Date): boolean {
		return a instanceof Date && a.getTime() === b.getTime();
	}

	const looks = $derived(metrics.map((_, i) => lineLook(style, i + 1)));
	const inkOf = (n: number) => (style === 'pattern' ? CHART_INK : chartColor(n));

	const config = $derived(
		Object.fromEntries([
			...metrics.map((m, i) => [m.key, { label: m.label, color: inkOf(i + 1) }]),
			...(comparison ? [[comparison.key, { label: comparison.label, color: COMPARISON_LOOK.stroke }]] : [])
		]) satisfies Chart.ChartConfig
	);

	// LayerChart gives the props of a series to its line. A line takes the look of its category. An area
	// takes its fill, and the chart draws its top line apart, with no props of the series (areaMarks).
	const series = $derived([
		...metrics.map((m, i) => ({
			key: m.key,
			label: m.label,
			value: m.key,
			color: inkOf(i + 1),
			props: kind === 'area' ? { fill: categoryFill(style, prefix, 1), fillOpacity: 1 } : markProps(looks[i]!)
		})),
		...(comparison
			? [{ key: comparison.key, label: comparison.label, value: comparison.key, color: COMPARISON_LOOK.stroke, props: markProps(COMPARISON_LOOK) }]
			: [])
	]);

	const lookOf = (key: string): LineLook => {
		const i = metrics.findIndex((m) => m.key === key);
		return i >= 0 ? looks[i]! : COMPARISON_LOOK;
	};
	const labelOf = (key: string) => metrics.find((m) => m.key === key)?.label ?? (comparison?.key === key ? comparison.label : key);

	// The value axis reaches the largest value of any line and of any reference line.
	const valueKeys = $derived([...metrics.map((m) => m.key), ...(comparison ? [comparison.key] : [])]);
	const largest = $derived(
		Math.max(0, ...data.flatMap((row) => valueKeys.map((k) => Number(row[k] ?? 0))), ...references.map((r) => r.value))
	);
	const ticks = $derived(threeTicks(largest));

	const svg = $derived({
		title,
		'aria-describedby': [summaryId, comparison && changeId, tableId, references.length && referenceTableId].filter(Boolean).join(' ')
	});

	// The text is measured again when the web font replaces the fallback, and when the width of the
	// window changes the text step. The width of the plot is not read here, because the room at its
	// right comes from these widths.
	let fontsLoaded = $state(false);
	$effect(() => {
		document.fonts.ready.then(() => (fontsLoaded = true));
	});
	const pen = $derived.by(() => {
		void fontsLoaded;
		void innerWidth.current;
		if (!container) return null;
		const canvas = document.createElement('canvas').getContext('2d');
		if (!canvas) return null;
		const font = getComputedStyle(container);
		return (text: string, weight: number) => {
			canvas.font = `${weight} ${font.fontSize} ${font.fontFamily}`;
			return canvas.measureText(text).width;
		};
	});

	// The labels at the right end: each line of a chart with two metrics, the comparison line and each
	// reference line. The name is small at 500 in foreground, and a value small in muted-foreground.
	type EndLabel = { id: string; name: string; value?: string; at: number };
	const LABEL_GAP = 4; // from the end of the plot to the label
	const LABEL_STEP = 16; // the least distance between two labels, a line of the small step
	const endLabels = $derived.by((): Omit<EndLabel, 'at'>[] => [
		...(metrics.length > 1 ? metrics.map((m) => ({ id: m.key, name: m.label })) : []),
		...(comparison ? [{ id: comparison.key, name: comparison.label }] : []),
		...references.map((r, i) => ({ id: `reference-${i}`, name: r.label, value: format(r.value) }))
	]);
	const widestDate = $derived(pen ? Math.max(0, ...data.map((row) => pen(dateFormat(row[x] as Date), 400))) : 0);
	// The room at the right of the plot holds the widest label, and at least half the widest date name,
	// which stands centered on the last x value.
	const labelRoom = $derived.by(() => {
		const half = Math.ceil(widestDate / 2);
		if (!endLabels.length || !pen) return Math.max(4, half);
		const widths = endLabels.map((l) => pen(l.name, 500) + (l.value ? pen(` ${l.value}`, 400) : 0));
		return Math.max(Math.ceil(Math.max(...widths)) + LABEL_GAP + 4, half);
	});

	/** The labels at their heights: each at the height of the end of its line, moved apart in order. */
	function placeLabels(c: ChartState<Row>): EndLabel[] {
		// A chart with no data has no end of a line, so its labels stand at 0.
		const last = data.at(-1);
		const placed = endLabels.map((l) => {
			const reference = l.id.startsWith('reference-') ? references[Number(l.id.slice(10))] : undefined;
			return { ...l, at: c.yScale(reference ? reference.value : Number(last?.[l.id] ?? 0)) };
		});
		placed.sort((a, b) => a.at - b.at);
		placed.forEach((p, i) => (p.at = Math.max(p.at, 0, i ? placed[i - 1]!.at + LABEL_STEP : 0)));
		for (let i = placed.length - 1; i >= 0; i--) {
			placed[i]!.at = Math.min(placed[i]!.at, i === placed.length - 1 ? c.height : placed[i + 1]!.at - LABEL_STEP);
		}
		return placed;
	}

	// The annotations in time order, numbered from 1.
	const events = $derived(
		[...annotations].sort((a, b) => a.at.getTime() - b.at.getTime()).map((a, i) => ({ ...a, n: i + 1 }))
	);
	const DISC = 16; // the side of a numbered mark
	const DISC_GAP = 2; // the least space between two marks
	const DISC_TOP = 4; // from the base line to the top of a mark
	/** The center of each mark on the time axis: at its x value, moved apart in order when two meet. */
	function placeEvents(c: ChartState<Row>): { n: number; at: number; x: number }[] {
		const placed = events.map((e) => ({ n: e.n, at: Number(c.xScale(e.at)), x: Number(c.xScale(e.at)) }));
		const step = DISC + DISC_GAP;
		placed.forEach((p, i) => (p.x = Math.max(p.x, DISC / 2, i ? placed[i - 1]!.x + step : 0)));
		for (let i = placed.length - 1; i >= 0; i--) {
			placed[i]!.x = Math.min(placed[i]!.x, i === placed.length - 1 ? c.width : placed[i + 1]!.x - step);
		}
		return placed;
	}

	// The time axis names every day when the names fit, and else the first day and the first day of
	// each week (Monday), or of every second or fourth week. The first name starts at the origin, so a
	// centered name closer than 8 px to it is left out.
	const NAME_GAP = 8;
	const xTicks = $derived.by(() => {
		const dates = data.map((row) => row[x] as Date);
		const plot = context?.width ?? 0;
		if (!widestDate || !plot || dates.length < 2) return dates.slice(0, 1);
		const step = plot / (dates.length - 1);
		const clear = (i: number) => i * step >= widestDate * 1.5 + NAME_GAP;
		if (step >= widestDate + NAME_GAP) return dates.filter((_, i) => i === 0 || clear(i));
		const weeks = [1, 2, 4].find((k) => k * 7 * step >= widestDate + NAME_GAP) ?? 4;
		const mondays = dates.map((d, i) => ({ d, i })).filter(({ d }) => d.getDay() === 1);
		const named = mondays.filter(({ i }) => clear(i)).filter((_, k) => k % weeks === 0);
		return [dates[0], ...named.map(({ d }) => d)];
	});

	const padding = $derived({ top: 8, bottom: events.length ? 40 : 20, left: 32, right: labelRoom });
	const yAxis = $derived({ ticks, format });
	const grid = $derived({ yTicks: ticks });
	// The names of the time axis stand under the row of the marks when the chart has annotations.
	const xAxis = $derived({ ticks: xTicks, format: (d: Date) => dateFormat(d), tickLength: events.length ? 22 : 4, tickLabel: timeName });
	const line = $derived(markProps(lineLook(style, 1)));

	// The change as text: the value of each whole period and the change in percent, with up or down.
	const change = $derived.by(() => {
		if (!comparison) return '';
		const { current, previous, period } = comparison;
		const diff = current - previous;
		const word = diff > 0 ? 'up' : 'down';
		if (diff === 0) return `the same as in ${period}`;
		if (previous === 0) return `${word} ${format(Math.abs(diff))} from 0 in ${period}`;
		return `${word} ${Math.round((Math.abs(diff) / previous) * 100)}% from ${format(previous)} in ${period}`;
	});

	const tooltipLabel = (value: unknown) => (value instanceof Date ? dateFormat(value) : String(value));
	const eventsAt = (value: unknown) => events.filter((e) => sameTime(value, e.at));
</script>

{#snippet tooltipRow({ item }: { item: Tooltip.TooltipSeries })}
	<span class="flex shrink-0"><LineTile look={lookOf(item.key)} /></span>
	<div class="flex flex-1 items-center justify-between gap-2 leading-none">
		<span class="text-muted-foreground">{labelOf(item.key)}</span>
		<span class="font-medium text-foreground tabular-nums">{format(Number(item.value))}</span>
	</div>
{/snippet}

{#snippet baseLine({ context: c }: { context: ChartState<Row> })}
	<line x1={c.xRange[0]} x2={c.xRange[1]} y1={c.yScale(0)} y2={c.yScale(0)} class="stroke-border" stroke-width="1" data-chart-base-line />
{/snippet}

<!-- The guides of the annotations and the reference lines lie over a fill and under each line. A
     reference line has a 1 px edge in the ground at each side, so that it shows on a solid fill. -->
{#snippet guides(c: ChartState<Row>)}
	<g data-chart-annotation-lines>
		{#each events as e (e.n)}
			{@const ex = Math.round(Number(c.xScale(e.at))) + 0.5}
			<line x1={ex} x2={ex} y1="0" y2={c.height + DISC_TOP} class="stroke-border" stroke-width="1" shape-rendering="crispEdges" />
		{/each}
	</g>
	<g data-chart-references>
		{#each references as r, i (i)}
			{@const ry = Math.round(c.yScale(r.value)) + 0.5}
			<line x1={c.xRange[0]} x2={c.xRange[1]} y1={ry} y2={ry} stroke={groundColor(ground)} stroke-width="3" shape-rendering="crispEdges" />
			<line
				x1={c.xRange[0]}
				x2={c.xRange[1]}
				y1={ry}
				y2={ry}
				stroke={REFERENCE_STROKE}
				stroke-width="1"
				shape-rendering="crispEdges"
				data-chart-reference={i}
			/>
		{/each}
	</g>
{/snippet}

<!-- The comparison line lies under the lines of the metrics, so the series draw in reverse order. -->
{#snippet lineMarks({ context: c }: { context: ChartState<Row> })}
	{@render guides(c)}
	{#each [...series].reverse() as s (s.key)}
		<Spline seriesKey={s.key} />
	{/each}
{/snippet}

<!-- The fill of the area, then the guides, then its top line, which takes no props of the series. -->
{#snippet areaMarks({ context: c }: { context: ChartState<Row> })}
	{#each series as s (s.key)}
		<Area seriesKey={s.key} {...s.props} />
	{/each}
	{@render guides(c)}
	{#each series as s (s.key)}
		<Spline {data} {x} y={s.key} {...line} class="lc-area-line" />
	{/each}
{/snippet}

<!-- The first name of the time axis starts at the origin, so that it never meets the 0 of the value
     axis. -->
{#snippet timeName({ props, index }: { props: TextProps; index: number })}
	<Text {...props} textAnchor={index === 0 ? 'start' : 'middle'} />
{/snippet}

{#snippet above({ context: c }: { context: ChartState<Row> })}
	<g aria-hidden="true" data-chart-end-labels>
		{#each placeLabels(c) as l (l.id)}
			<text x={c.width + LABEL_GAP} y={l.at + 4} class="text-xs" data-chart-end-label={l.id}>
				<tspan class="fill-foreground font-medium">{l.name}</tspan>{#if l.value}<tspan class="fill-muted-foreground tabular-nums">{` ${l.value}`}</tspan>{/if}
			</text>
		{/each}
	</g>
	<g aria-hidden="true" data-chart-annotations>
		{#each placeEvents(c) as p (p.n)}
			<circle cx={p.x} cy={c.height + DISC_TOP + DISC / 2} r={DISC / 2} class="fill-foreground" data-chart-annotation={p.n} />
			<text x={p.x} y={c.height + DISC_TOP + DISC / 2 + 4} text-anchor="middle" class="fill-background text-2xs font-medium tabular-nums">{p.n}</text>
		{/each}
	</g>
{/snippet}

<figure
	bind:this={ref}
	data-slot="time-chart"
	data-time-chart={kind}
	data-chart-style={style}
	class={cn('m-0 flex min-w-0 flex-col gap-1', placeOf(className))}
	{...rest}
>
	<figcaption class="text-sm font-medium">{title}</figcaption>
	<p id={summaryId} class="text-xs text-muted-foreground">{summary}</p>
	{#if comparison}
		<p id={changeId} class="text-xs tabular-nums" data-chart-change>
			<span class="font-medium">{format(comparison.current)}</span>, {change}
		</p>
	{/if}
	{#if kind === 'area' && style !== 'color'}<StackPatternDefs {prefix} {style} />{/if}
	<Chart.Container {config} class={cn('h-64 w-full', sizeOf(className))} bind:ref={container}>
		{#if kind === 'area'}
			<AreaChart
				{data}
				{x}
				{series}
				yDomain={[0, ticks[2]]}
				yNice={false}
				rule={false}
				{padding}
				bind:context={context!}
				props={{ svg, yAxis, grid, xAxis }}
				belowMarks={baseLine}
				marks={areaMarks}
				aboveMarks={above}
			>
				{#snippet tooltip()}
					<Chart.Tooltip labelFormatter={tooltipLabel} formatter={tooltipRow} />
				{/snippet}
			</AreaChart>
		{:else}
			<LineChart
				{data}
				{x}
				{series}
				yDomain={[0, ticks[2]]}
				yNice={false}
				rule={false}
				{padding}
				bind:context={context!}
				props={{ svg, yAxis, grid, xAxis }}
				belowMarks={baseLine}
				marks={lineMarks}
				aboveMarks={above}
			>
				{#snippet tooltip()}
					<Chart.Tooltip labelFormatter={tooltipLabel} formatter={tooltipRow} />
				{/snippet}
			</LineChart>
		{/if}
	</Chart.Container>
	{#if events.length}
		<ol class="mt-2 flex flex-col gap-1 text-xs" data-chart-annotation-list>
			{#each events as e (e.n)}
				<li class="flex items-start gap-2">
					<span class="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-foreground text-2xs font-medium text-background tabular-nums">{e.n}</span>
					<span><span class="text-muted-foreground tabular-nums">{dateFormat(e.at)}</span> {e.text}</span>
				</li>
			{/each}
		</ol>
	{/if}
	<div>
		<Button
			variant="outline"
			size="sm"
			class="mt-2 print:hidden"
			aria-expanded={tableShown}
			aria-controls={references.length ? `${tableId} ${referenceTableId}` : tableId}
			onclick={() => (tableShown = !tableShown)}
			>{tableShown ? 'Hide' : 'Show'} the data as a table</Button
		>
	</div>
	<!-- A table does not shrink to the 1 px box of sr-only, so a wrapper hides it. -->
	<div class={tableShown ? 'mt-2 flex flex-col gap-4' : 'sr-only'}>
		<Table.Root id={tableId}>
			<Table.Caption class="text-left text-xs">{title}</Table.Caption>
			<Table.Header>
				<Table.Row>
					<Table.Head scope="col">{rowHeaderLabel}</Table.Head>
					{#each valueKeys as key (key)}
						<Table.Head scope="col" class="text-right">{labelOf(key)}</Table.Head>
					{/each}
					{#if events.length}<Table.Head scope="col">Annotation</Table.Head>{/if}
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data as row, r (r)}
					<Table.Row>
						<Table.Head scope="row" class="h-auto p-2 font-normal tabular-nums">{dateFormat(row[x] as Date)}</Table.Head>
						{#each valueKeys as key (key)}
							<Table.Cell class="text-right tabular-nums">{format(Number(row[key]))}</Table.Cell>
						{/each}
						{#if events.length}
							<Table.Cell class="whitespace-normal">{eventsAt(row[x]).map((e) => `${e.n}. ${e.text}`).join(' ')}</Table.Cell>
						{/if}
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
		{#if references.length}
			<Table.Root id={referenceTableId}>
				<Table.Caption class="text-left text-xs">{title}: reference lines</Table.Caption>
				<Table.Header>
					<Table.Row>
						<Table.Head scope="col">Line</Table.Head>
						<Table.Head scope="col" class="text-right">Value</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each references as ref, i (i)}
						<Table.Row>
							<Table.Head scope="row" class="h-auto p-2 font-normal">{ref.label}</Table.Head>
							<Table.Cell class="text-right tabular-nums">{format(ref.value)}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{/if}
	</div>
</figure>

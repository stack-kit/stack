<!--
	A heat map: a grid of square cells, one for each row and column, each in one of the five steps of
	DESIGN.md (`### Heat map`). A step is the color of the chart at an opacity: chart-ink in the pattern
	style, chart-heat in the two color styles. Each cell has a 1 px edge in that color at full
	strength, and two cells that meet share one edge. The legend under the chart lists the five steps
	in order, each with its range in words. The tooltip and the data table give the value of each cell.
	When the column names do not fit under their cells, the axis names every nth column, by the rule
	of "A long category axis" in DESIGN.md. The chart renders on the client only, on the SVG layer, in
	a container of fixed height.
-->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';
	import type { ChartStyle } from './patterns.js';

	type Cell = { row: string; column: string; value: number };
	/** A step and its range in words. The step covers the values from `min` up to the next step. */
	type Step = { min: number; label: string };

	/** @behaviour print:fit-column */
	export type HeatMapProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'class' | 'style' | 'title'> & {
		/** The root, the figure of the chart. */
		ref?: HTMLElement | null;
		style?: ChartStyle;
		/** The name of the chart: the caption, the svg title and the table caption. */
		title: string;
		/** One or two sentences that state what the chart shows. */
		summary: string;
		/** The names of the rows, from the top. */
		rows: string[];
		/** The names of the columns, from the left. */
		columns: string[];
		data: Cell[];
		/** The five steps, from the smallest count to the largest. */
		steps: Step[];
		rowHeaderLabel: string;
		valueLabel?: string;
		format?: (value: number) => string;
		/** Classes for the root, which place the part, such as a margin, a grid cell or a width. A height class, such as h-80, sets the height of the chart container. */
		class?: string;
	};
</script>

<script lang="ts">
	import { Axis, Chart, Svg } from 'layerchart/svg';
	import type { ChartState } from 'layerchart';
	import * as ChartUi from '#lib/components/ui/chart/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import { registerChart } from '#lib/print/chart-width.js';
	import { cn } from '#lib/utils.js';
	import { placeOf, sizeOf } from './chart-class.js';
	import { HEAT_STEPS, LEGEND_TILE, heatColor, patternPrefix } from './patterns.js';

	let {
		style = 'pattern',
		title,
		summary,
		rows,
		columns,
		data,
		steps,
		rowHeaderLabel,
		valueLabel = 'Value',
		format = (v: number) => v.toLocaleString('en'),
		class: className = 'h-64 w-full',
		ref = $bindable(null),
		...rest
	}: HeatMapProps = $props();

	const uid = $props.id();
	const prefix = patternPrefix(uid);
	const summaryId = `${prefix}-summary`;
	const tableId = `${prefix}-table`;

	// The context stays undefined until the chart mounts. The type of the LayerChart prop leaves undefined
	// out, so each bind:context takes "!", which only satisfies that type.
	let context = $state<ChartState<Cell>>();
	$effect(() => (context ? registerChart(context) : undefined));
	let container = $state<HTMLElement | null>(null);
	let tableShown = $state(false);

	const color = $derived(heatColor(style));
	const config = $derived({ value: { label: valueLabel } } satisfies ChartUi.ChartConfig);
	const series = $derived([{ key: 'value', label: valueLabel, value: 'value' }]);

	/** The step of a value: the last step whose minimum it reaches. */
	function stepOf(value: number): number {
		let s = 0;
		steps.forEach((step, i) => {
			if (value >= step.min) s = i;
		});
		return s;
	}

	// The side of a cell, in whole pixels, so that every edge falls on a whole pixel.
	const side = ({ width, height }: { width: number; height: number }) =>
		Math.floor(Math.min(width / columns.length, height / rows.length));

	// The steps of "A long category axis" in DESIGN.md: the axis names every nth column, where n is the
	// smallest step for which n cells are at least the widest name plus 8 px. The first column always
	// has its name.
	const NAME_STEPS = [1, 2, 3, 4, 6, 12];
	const NAME_GAP = 8;

	// A fallback font has other widths than the web font, so the names are measured again when the fonts load.
	let fontsLoaded = $state(false);
	$effect(() => {
		document.fonts.ready.then(() => (fontsLoaded = true));
	});

	/** The width of the widest column name in the font of the axis labels, which is the font of the container. */
	const widestName = $derived.by(() => {
		// The width of the chart and the font state are read, so that the names are measured again when
		// the text step changes and when the web font replaces the fallback.
		void fontsLoaded;
		if (!container || !context?.width) return 0;
		const pen = document.createElement('canvas').getContext('2d');
		if (!pen) return 0;
		const font = getComputedStyle(container);
		pen.font = `${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
		return Math.max(0, ...columns.map((name) => pen.measureText(name).width));
	});

	const namedColumns = $derived.by(() => {
		const cell = context?.xScale.bandwidth?.() ?? 0;
		const n = NAME_STEPS.find((step) => step * cell >= widestName + NAME_GAP) ?? NAME_STEPS[NAME_STEPS.length - 1]!;
		return columns.filter((_, i) => i % n === 0);
	});

	const valueAt = (row: string, column: string) =>
		data.find((d) => d.row === row && d.column === column)?.value ?? 0;

	const cellOf = (d: unknown) => d as Cell | null;
</script>

{#snippet tile(step: number)}
	<svg width={LEGEND_TILE} height={LEGEND_TILE} aria-hidden="true" class="shrink-0" data-heat-tile={step + 1}>
		<rect
			x="0.5"
			y="0.5"
			width={LEGEND_TILE - 1}
			height={LEGEND_TILE - 1}
			fill={color}
			fill-opacity={HEAT_STEPS[step]}
			stroke={color}
			stroke-width="1"
		/>
	</svg>
{/snippet}

{#snippet tooltipRow({ item }: { item: { value?: unknown } })}
	<span class="flex shrink-0">{@render tile(stepOf(Number(item.value)))}</span>
	<div class="flex flex-1 items-center justify-between gap-2 leading-none">
		<span class="text-muted-foreground">{valueLabel}</span>
		<span class="font-medium text-foreground tabular-nums">{format(Number(item.value))}</span>
	</div>
{/snippet}

<figure
	bind:this={ref}
	data-slot="heat-map"
	data-heat-map
	data-chart-style={style}
	class={cn('m-0 flex min-w-0 flex-col gap-1', placeOf(className))}
	{...rest}
>
	<figcaption class="text-sm font-medium">{title}</figcaption>
	<p id={summaryId} class="text-xs text-muted-foreground">{summary}</p>
	<ChartUi.Container {config} class={cn('h-64 w-full', sizeOf(className))} bind:ref={container}>
		<Chart
			{data}
			x="column"
			y="row"
			xDomain={columns}
			yDomain={rows}
			xRange={(size) => [0, side(size) * columns.length]}
			yRange={(size) => [0, side(size) * rows.length]}
			padding={{ top: 4, bottom: 20, left: 72, right: 4 }}
			{series}
			tooltipContext={{ mode: 'band' }}
			bind:context={context!}
		>
			{#snippet children({ context: c })}
				<Svg {title} aria-describedby="{summaryId} {tableId}">
					<Axis placement="left" rule={false} tickMarks={false} />
					<Axis placement="bottom" rule={false} tickMarks={false} ticks={namedColumns} />
					<g data-heat-cells>
						{#each data as d (`${d.row}|${d.column}`)}
							{@const s = stepOf(d.value)}
							<rect
								x={Number(c.xScale(d.column)) + 0.5}
								y={Number(c.yScale(d.row)) + 0.5}
								width={c.xScale.bandwidth?.() ?? 0}
								height={c.yScale.bandwidth?.() ?? 0}
								fill={color}
								fill-opacity={HEAT_STEPS[s]}
								stroke={color}
								stroke-width="1"
								data-heat-step={s + 1}
							/>
						{/each}
					</g>
				</Svg>
				<ChartUi.Tooltip
					labelFormatter={() => {
						const d = cellOf(context?.tooltip.data ?? null);
						return d ? `${d.row}, ${d.column}` : '';
					}}
					formatter={tooltipRow}
				/>
			{/snippet}
		</Chart>
	</ChartUi.Container>
	<ul
		role="list"
		aria-label="The steps of the heat map"
		class="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs"
		data-heat-legend={prefix}
	>
		{#each steps as step, i (i)}
			<li class="flex items-center gap-1.5 px-1.5 py-0.5">{@render tile(i)}{step.label}</li>
		{/each}
	</ul>
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
			<Table.Header>
				<Table.Row>
					<Table.Head scope="col">{rowHeaderLabel}</Table.Head>
					{#each columns as column (column)}
						<Table.Head scope="col" class="text-right">{column}</Table.Head>
					{/each}
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each rows as row (row)}
					<Table.Row>
						<Table.Head scope="row" class="h-auto p-2 font-normal">{row}</Table.Head>
						{#each columns as column (column)}
							<Table.Cell class="text-right tabular-nums">{format(valueAt(row, column))}</Table.Cell>
						{/each}
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</figure>

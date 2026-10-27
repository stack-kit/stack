<script lang="ts">
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import FlowTable from '#lib/stack/FlowTable.svelte';
	import HeatMap from '#lib/stack/HeatMap.svelte';
	import PatternChart from '#lib/stack/PatternChart.svelte';
	import Sparkline from '#lib/stack/Sparkline.svelte';
	import TimeChart from '#lib/stack/TimeChart.svelte';
	import PatternTile from '#lib/stack/PatternTile.svelte';
	import StackPatternDefs from '#lib/stack/StackPatternDefs.svelte';
	import { PATTERNS, patternPrefix, patternUrl, type ChartStyle } from '#lib/stack/patterns.js';

	// Invented sample data. Every chart renders on the client, in a container of fixed height.
	const uid = $props.id();
	const prefix = patternPrefix(uid);
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
	const styles: ChartStyle[] = ['pattern', 'color-pattern', 'color'];

	const sources = [
		{ key: 'search', label: 'Search' },
		{ key: 'direct', label: 'Direct' },
		{ key: 'email', label: 'Email' },
		{ key: 'partners', label: 'Partners' }
	];
	const visits = sources.map((s, i) => ({ key: s.key, value: [18, 12, 7, 3][i] }));
	const thousands = (v: number) => `${v.toLocaleString('en')}k`;

	const quarters = ['Q1', 'Q2', 'Q3', 'Q4'].map((q) => ({ key: q.toLowerCase(), label: q }));
	const orders = quarters.map((q, i) => ({ key: q.key, value: [84, 112, 138, 116][i] }));

	const ticketTypes = [
		{ key: 'bug', label: 'Bug' },
		{ key: 'feature', label: 'Feature' },
		{ key: 'chore', label: 'Chore' },
		{ key: 'docs', label: 'Docs' },
		{ key: 'security', label: 'Security' }
	];
	const tickets = months.map((month, i) => ({
		month,
		bug: [42, 38, 51, 29, 34, 40][i],
		feature: [18, 25, 22, 31, 27, 35][i],
		chore: [12, 9, 15, 11, 14, 10][i],
		docs: [6, 8, 5, 9, 7, 11][i],
		security: [2, 1, 4, 3, 2, 5][i]
	}));

	const storageKinds = [
		{ key: 'documents', label: 'Documents' },
		{ key: 'images', label: 'Images' },
		{ key: 'video', label: 'Video' },
		{ key: 'backups', label: 'Backups' }
	];
	const storage = months.map((month, i) => ({
		month,
		date: new Date(2026, i, 1),
		documents: [12, 14, 15, 17, 18, 20][i],
		images: [20, 23, 27, 30, 32, 36][i],
		video: [35, 38, 44, 47, 55, 58][i],
		backups: [40, 40, 42, 42, 45, 45][i]
	}));

	const areas = [
		{ key: 'editor', label: 'Editor' },
		{ key: 'sync', label: 'Sync' },
		{ key: 'search', label: 'Search' },
		{ key: 'export', label: 'Export' },
		{ key: 'settings', label: 'Settings' },
		{ key: 'billing', label: 'Billing' },
		{ key: 'docs', label: 'Docs' },
		{ key: 'other', label: 'Other' }
	];
	const hours = areas.map((a, i) => ({ key: a.key, value: [124, 96, 71, 58, 40, 33, 27, 19][i] }));

	const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	const bands = ['0:00', '4:00', '8:00', '12:00', '16:00', '20:00'];
	const signIns = [
		[4, 12, 610, 540, 380, 60],
		[3, 15, 580, 520, 360, 55],
		[6, 11, 560, 505, 340, 48],
		[2, 14, 540, 490, 330, 52],
		[5, 9, 430, 380, 210, 35],
		[1, 0, 40, 70, 45, 18],
		[0, 2, 25, 55, 60, 30]
	];
	const signInCells = weekdays.flatMap((row, r) =>
		bands.map((column, c) => ({ row, column, value: signIns[r][c] }))
	);
	const signInSteps = [
		{ min: 0, label: '0 to 9' },
		{ min: 10, label: '10 to 49' },
		{ min: 50, label: '50 to 99' },
		{ min: 100, label: '100 to 499' },
		{ min: 500, label: '500 and more' }
	];

	const compared = [2, 4, 6, 8];

	// 28 days, 1 to 28 September 2026, and the 28 days before them for the comparison.
	const days = Array.from({ length: 28 }, (_, i) => new Date(2026, 8, 1 + i));
	const before = Array.from({ length: 28 }, (_, i) => new Date(2026, 7, 4 + i));
	// The share of an average day, by weekday from Sunday, and a small change of each day in percent.
	const weekly = [0.74, 1.04, 1.08, 1.07, 1.03, 0.96, 0.7];
	const mobileWeekly = [1.24, 0.94, 0.92, 0.95, 0.97, 1.03, 1.3];
	const jitter = [3, -2, 5, -4, 1, 6, -3, 2, -5, 4, 0, -1, 3, -6, 2, 5, -2, 1, -4, 3, 6, -3, 0, 2, -1, 4, -2, 1];
	const compact = (v: number) => (v < 1000 ? v.toLocaleString('en') : `${(v / 1000).toLocaleString('en', { maximumFractionDigits: 1 })}k`);
	const day = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

	// Page views: a launch on 10 September raises every day after it, a newsletter on 15 September
	// brings one high day, and an outage on 23 September one low day.
	const viewsOn = (i: number) =>
		Math.round((1300 + (i >= 9 ? 240 : 0)) * weekly[days[i].getDay()] * (1 + jitter[i] / 100) * (i === 14 ? 1.6 : i === 22 ? 0.55 : 1));
	const viewsBefore = (i: number) => Math.round(1260 * weekly[before[i].getDay()] * (1 + jitter[(i + 7) % 28] / 100));
	const pageViews = days.map((date, i) => ({ date, views: viewsOn(i), previous: viewsBefore(i) }));
	const sum = (values: number[]) => values.reduce((s, v) => s + v, 0);
	const viewsComparison = {
		key: 'previous',
		label: 'Previous 28 days',
		current: sum(pageViews.map((d) => d.views)),
		previous: sum(pageViews.map((d) => d.previous)),
		period: 'the previous 28 days'
	};
	const viewEvents = [
		{ at: days[9], text: 'Launch of the pages in Serbian' },
		{ at: days[14], text: 'Newsletter of September sent' },
		{ at: days[22], text: 'Outage of 40 minutes' }
	];

	const devices = [
		{ key: 'desktop', label: 'Desktop' },
		{ key: 'mobile', label: 'Mobile' }
	];
	const deviceVisits = days.map((date, i) => ({
		date,
		desktop: Math.round(820 * weekly[date.getDay()] * (1 + jitter[i] / 100)),
		mobile: Math.round(560 * mobileWeekly[date.getDay()] * (1 - jitter[(i + 3) % 28] / 100))
	}));

	// Peak memory of a machine: it grows by about 0.13 GB a day and passes two of its four lines.
	const memory = days.map((date, i) => ({ date, memory: Math.round((3.4 + i * 0.13 + jitter[i] / 25) * 10) / 10 }));
	const gb = (v: number) => v.toLocaleString('en', { maximumFractionDigits: 1 });
	const memoryLines = [
		{ label: 'Target', value: 4 },
		{ label: 'Check', value: 6 },
		{ label: 'Warning', value: 7.5 },
		{ label: 'Limit', value: 8 }
	];

	// The page views of four pages over the same 28 days, for the sparklines of a table.
	const pages = [
		{ path: '/', scale: 0.42, lift: 1.12 },
		{ path: '/pricing', scale: 0.16, lift: 1.21 },
		{ path: '/docs', scale: 0.24, lift: 0.94 },
		{ path: '/blog', scale: 0.1, lift: 1.02 }
	].map((p) => {
		const values = days.map((_, i) => Math.round(viewsOn(i) * p.scale * (1 + ((i / 27) * (p.lift - 1)))));
		const previous = Math.round(sum(days.map((_, i) => viewsBefore(i) * p.scale)));
		return { ...p, values, total: sum(values), previous };
	});
	const changeWords = (current: number, previous: number) => {
		const pct = Math.round((Math.abs(current - previous) / previous) * 100);
		return current === previous ? 'no change' : `${current > previous ? 'up' : 'down'} ${pct}%`;
	};
	const trendName = (what: string, values: number[]) =>
		`${what}, 1 to 28 September: from ${compact(values[0])} to ${compact(values[values.length - 1])}`;

	const transitions = [
		{ from: '/', to: '/pricing', count: 1240 },
		{ from: '/', to: '/docs', count: 980 },
		{ from: '/pricing', to: '/sign-up', count: 610 },
		{ from: '/docs', to: '/docs/install', count: 540 },
		{ from: '/blog', to: '/', count: 320 },
		{ from: '/pricing', to: '/', count: 290 },
		{ from: '/docs/install', to: '/sign-up', count: 210 }
	];
</script>

<svelte:head>
	<title>Charts</title>
</svelte:head>

{#snippet pair(style: ChartStyle)}
	<Card.Root class="max-w-5xl" data-chart-pair={style}>
		<Card.Content class="grid gap-8 md:grid-cols-2">
			<PatternChart
				kind="donut"
				{style}
				ground="card"
				title="Visits last month, by source"
				summary="Search brings 18k of the 40k visits, almost half. Partners bring the fewest, 3k."
				categories={sources}
				data={visits}
				valueLabel="Visits"
				format={thousands}
			/>
			<PatternChart
				kind="bar"
				{style}
				ground="card"
				title="Orders per quarter, 2026"
				summary="Orders grow from 84 in Q1 to 138 in Q3, and fall to 116 in Q4."
				categories={quarters}
				data={orders}
				valueLabel="Orders"
			/>
		</Card.Content>
	</Card.Root>
{/snippet}

{#snippet kinds(style: ChartStyle)}
	<div class="grid max-w-6xl gap-10 lg:grid-cols-2" data-chart-kinds={style}>
		<PatternChart
			kind="stacked-bar"
			{style}
			title="Tickets closed per month, by type, January to June 2026"
			summary="Bugs are the largest type in every month except April. The most tickets closed in one month is 101, in June."
			categories={ticketTypes}
			data={tickets}
			x="month"
			rowHeaderLabel="Month"
		/>
		<PatternChart
			kind="stacked-area"
			{style}
			title="Storage used at the start of each month, in GB, by kind, January to June 2026"
			summary="Storage grows from 107 GB to 159 GB. Video grows the most, from 35 GB to 58 GB."
			categories={storageKinds}
			data={storage}
			x="date"
			rowHeader="month"
			rowHeaderLabel="Month"
		/>
		<PatternChart
			kind="donut"
			{style}
			title="Hours spent last quarter, by area"
			summary="The editor takes 124 of 468 hours, about a quarter. The eight areas take patterns 1 to 8."
			categories={areas}
			data={hours}
			valueLabel="Hours"
		/>
	</div>
{/snippet}

{#snippet lines(style: ChartStyle)}
	{@const note = style === 'pattern' ? '' : style === 'color' ? ', in the color style' : ', in the color pattern style'}
	<div class="grid max-w-6xl gap-10 lg:grid-cols-2" data-chart-lines={style}>
		<TimeChart
			{style}
			title="Page views per day, 1 to 28 September 2026{note}"
			summary="Page views rise after the launch of the pages in Serbian. The newsletter brings the highest day, 2.7k, and the outage the lowest weekday, 906."
			metrics={[{ key: 'views', label: 'Page views' }]}
			data={pageViews}
			comparison={viewsComparison}
			annotations={viewEvents}
			format={compact}
			dateFormat={day}
		/>
		<TimeChart
			{style}
			title="Visits per day by device, 1 to 28 September 2026{note}"
			summary="Desktop brings more visits on a weekday, and mobile more on a weekend."
			metrics={devices}
			data={deviceVisits}
			format={compact}
			dateFormat={day}
		/>
		<TimeChart
			kind="area"
			{style}
			title="Peak memory of the build machine per day, in GB, 1 to 28 September 2026{note}"
			summary="Peak memory grows from 3.5 GB to 7 GB. It reaches the target on 5 September and the check on 20 September."
			metrics={[{ key: 'memory', label: 'Peak memory' }]}
			data={memory}
			references={memoryLines}
			format={gb}
			dateFormat={day}
		/>
	</div>
{/snippet}

<h1 class="mb-1 text-xl font-semibold">Charts</h1>
<p class="mb-6 max-w-3xl text-sm text-muted-foreground">
	A chart draws in ink on the paper: category n takes the pattern pattern-n of DESIGN.md, in
	chart-ink on the ground under the chart. The same patterns in chart-1 to chart-8 are the color
	pattern style, and the solid colors chart-1 to chart-8 are the color style. A product takes one
	style as its default, and a person may pick one. Hover a shape for its tooltip. The button under
	each chart shows its data as a table.
</p>

<StackPatternDefs {prefix} />

<section class="mb-10" aria-labelledby="pattern-style">
	<h2 id="pattern-style" class="mb-1 text-base font-semibold">The pattern style</h2>
	<p class="mb-3 max-w-3xl text-sm text-muted-foreground">
		The default. Each label sits on the chart: a leader line goes from each slice of the donut to
		its name and value, the total sits in the center, and each bar has its value above it. The value
		axis has three ticks.
	</p>
	{@render pair('pattern')}
</section>

<section class="mb-10" aria-labelledby="pattern-kinds">
	<h2 id="pattern-kinds" class="mb-1 text-base font-semibold">Stacked bars, stacked areas and a donut of eight</h2>
	<p class="mb-3 max-w-3xl text-sm text-muted-foreground">
		The categories of a stack share one bar or one area, so a stacked chart has a legend under it. A
		click on a legend item shows only that category, and each further click adds or removes one.
	</p>
	{@render kinds('pattern')}
</section>

<section class="mb-10" aria-labelledby="pattern-lines">
	<h2 id="pattern-lines" class="mb-1 text-base font-semibold">Lines over time</h2>
	<p class="mb-3 max-w-3xl text-sm text-muted-foreground">
		One or two metrics over time. Line 1 is solid and line 2 dotted. The previous period is a dashed
		line in muted-foreground, with the change as text above the plot. A numbered disc on the time axis
		points to an annotation in the list under the chart. A reference line is a 1 px line in
		muted-foreground, with its name and value at its right end. An area holds one metric, and its top
		line is the line of the metric.
	</p>
	{@render lines('pattern')}
</section>

<section class="mb-10" aria-labelledby="color-pattern-style">
	<h2 id="color-pattern-style" class="mb-1 text-base font-semibold">The color pattern style</h2>
	<p class="mb-3 max-w-3xl text-sm text-muted-foreground">
		The same patterns, with the marks of pattern n in chart-n on the ground under the chart. The
		pattern tells the categories apart, and the color helps a person to find one category across
		many charts. The tile of the legend and of the tooltip shows the pattern in its color.
	</p>
	<div class="flex flex-col gap-10">
		{@render pair('color-pattern')}
		{@render kinds('color-pattern')}
		{@render lines('color-pattern')}
	</div>
</section>

<section class="mb-10" aria-labelledby="color-style">
	<h2 id="color-style" class="mb-1 text-base font-semibold">The color style</h2>
	<p class="mb-3 max-w-3xl text-sm text-muted-foreground">
		The same charts in solid fills, chart-1 to chart-8, with no pattern. A 1 px gap in the ground
		keeps two fills apart. The names stay on the chart, in the legend, in the tooltip and in the
		table, because color alone does not tell the categories apart.
	</p>
	<div class="flex flex-col gap-10">
		{@render pair('color')}
		{@render kinds('color')}
		{@render lines('color')}
	</div>
</section>

<section class="mb-10" aria-labelledby="heat-map">
	<h2 id="heat-map" class="mb-1 text-base font-semibold">A heat map</h2>
	<p class="mb-3 max-w-3xl text-sm text-muted-foreground">
		Five steps of one color at 50, 62, 75, 88 and 100%: chart-ink in the pattern style, chart-heat in
		the two color styles. Each square has a 1 px edge in that color at full strength. The legend
		names the range of each step, and the tooltip and the table give each value.
	</p>
	<div class="grid max-w-6xl gap-10 lg:grid-cols-2">
		{#each ['pattern', 'color'] as const as style (style)}
			<HeatMap
				{style}
				title="Sign-ins last week, by weekday and time of day{style === 'color' ? ', in a color style' : ''}"
				summary="Most sign-ins come between 8:00 and 16:00 on a weekday. The weekend has few at any time."
				rows={weekdays}
				columns={bands}
				data={signInCells}
				steps={signInSteps}
				rowHeaderLabel="Weekday"
				valueLabel="Sign-ins"
				class="h-80 w-full"
			/>
		{/each}
	</div>
</section>

<section class="mb-10" aria-labelledby="sparklines">
	<h2 id="sparklines" class="mb-1 text-base font-semibold">Sparklines</h2>
	<p class="mb-3 max-w-3xl text-sm text-muted-foreground">
		The shape of one metric over time, in a row or beside a figure, with no axis. Its value stands
		beside it as text, and its accessible name gives the period and the first and the last value. The
		first table is in the pattern style, the second in the color style.
	</p>
	<div class="grid max-w-6xl gap-10 lg:grid-cols-2">
		{#each ['pattern', 'color'] as const as style (style)}
			<div class="flex min-w-0 flex-col gap-6" data-sparklines={style}>
				<div class="flex items-end gap-3">
					<div>
						<p class="text-xs text-muted-foreground">Page views, 1 to 28 September</p>
						<p class="text-3xl font-semibold tabular-nums">{compact(viewsComparison.current)}</p>
					</div>
					<span class="pb-1.5"><Sparkline {style} values={pageViews.map((d) => d.views)} label={trendName('Page views per day', pageViews.map((d) => d.views))} /></span>
				</div>
				<Table.Root>
					<Table.Caption class="text-left">The page views of each page, 1 to 28 September 2026{style === 'color' ? ', in the color style' : ''}</Table.Caption>
					<Table.Header>
						<Table.Row>
							<Table.Head scope="col">Page</Table.Head>
							<Table.Head scope="col">Per day</Table.Head>
							<Table.Head scope="col" class="text-right">Page views</Table.Head>
							<Table.Head scope="col" class="text-right">Change</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each pages as p (p.path)}
							<Table.Row>
								<Table.Head scope="row" class="h-auto p-2 font-normal">{p.path}</Table.Head>
								<Table.Cell><Sparkline {style} values={p.values} label={trendName(`Page views of ${p.path} per day`, p.values)} /></Table.Cell>
								<Table.Cell class="text-right tabular-nums">{compact(p.total)}</Table.Cell>
								<Table.Cell class="text-right tabular-nums">{changeWords(p.total, p.previous)}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		{/each}
	</div>
</section>

<section class="mb-10" aria-labelledby="flow">
	<h2 id="flow" class="mb-1 text-base font-semibold">A flow</h2>
	<p class="mb-3 max-w-3xl text-sm text-muted-foreground">
		The moves from one page to the next, as a table of from, to and count, largest first. A flow is a
		table and not a Sankey diagram.
	</p>
	<div class="max-w-xl">
		<FlowTable title="Moves from one page to the next, 1 to 28 September 2026" rows={transitions} />
	</div>
</section>

<section class="mb-10" aria-labelledby="compared">
	<h2 id="compared" class="mb-1 text-base font-semibold">Patterns 2, 4, 6 and 8 at 1x</h2>
	<p class="mb-3 max-w-3xl text-sm text-muted-foreground">
		Patterns 6 and 8 stagger their marks, and differ from patterns 2 and 4 in size and pitch too:
		pattern 6 has smaller dots further apart, and pattern 8 larger squares further apart. Each
		pattern shows as a 64 px square, an 8 px bar and the 12 px legend tile, with one user unit to
		one CSS pixel.
	</p>
	<div class="flex flex-wrap gap-8">
		{#each compared as n (n)}
			{@const p = PATTERNS[n - 1]}
			<figure class="m-0 flex flex-col gap-2" data-pattern-sample={n}>
				<svg width="64" height="80" aria-hidden="true">
					<rect width="64" height="64" fill={patternUrl(prefix, n)} />
					<rect y="72" width="64" height="8" fill={patternUrl(prefix, n)} />
				</svg>
				<PatternTile {prefix} {n} />
				<figcaption class="text-xs tabular-nums">
					pattern-{n}<br />{p.type}, width {p.width}, pitch {p.pitch}{p.stagger ? ', stagger' : ''}
				</figcaption>
			</figure>
		{/each}
	</div>
</section>

<section class="mb-10" aria-labelledby="patterns">
	<h2 id="patterns" class="mb-2 text-base font-semibold">The eight patterns</h2>
	<Table.Root class="max-w-2xl">
		<Table.Header>
			<Table.Row>
				<Table.Head>Tile</Table.Head>
				<Table.Head>Name</Table.Head>
				<Table.Head>Type</Table.Head>
				<Table.Head class="text-right">Angle</Table.Head>
				<Table.Head class="text-right">Width</Table.Head>
				<Table.Head class="text-right">Pitch</Table.Head>
				<Table.Head>Stagger</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each PATTERNS as p, i (i)}
				<Table.Row data-pattern-row={i + 1}>
					<Table.Cell><PatternTile {prefix} n={i + 1} /></Table.Cell>
					<Table.Cell class="font-medium tabular-nums">pattern-{i + 1}</Table.Cell>
					<Table.Cell>{p.type}</Table.Cell>
					<Table.Cell class="text-right tabular-nums">{p.angle}</Table.Cell>
					<Table.Cell class="text-right tabular-nums">{p.width}</Table.Cell>
					<Table.Cell class="text-right tabular-nums">{p.pitch}</Table.Cell>
					<Table.Cell>{p.stagger}</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</section>

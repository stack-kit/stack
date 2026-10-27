<!--
	A bar chart of a printed document, drawn as plain SVG with no script of a chart library, as a
	renderer with no script on a server draws it ("### Charts in print" in ## Print of DESIGN.md).
	Category n draws the marks of pattern-n as shapes in a clip path of its bar, because Chromium
	writes a <pattern> fill into a PDF as an image of 72 dpi. The marks take currentColor, the ink of
	the document. The classes come from the css block of "### Print template": the value of each bar
	stands above it, the name of each bar under the base line, and the value axis has three ticks, 0,
	the middle and the maximum, with a grid line at each. The chart is 640 px wide, inside the 657 px
	of the text box of A4, and it takes no viewBox, so that each mark keeps its size in px.
-->
<script lang="ts">
	import { PATTERNS, threeTicks } from '#lib/stack/patterns.js';
	import { patternMarks } from './marks.js';

	let {
		title,
		summary,
		categories,
		format,
		width = 640,
		height = 200
	}: {
		/** The caption of the chart. */
		title: string;
		/** The accessible name of the svg: what the chart shows, with each value. */
		summary: string;
		/** One bar for each category, in pattern order. */
		categories: { label: string; value: number }[];
		/** The text of a value, the same on the chart and on the axis. */
		format: (n: number) => string;
		width?: number;
		height?: number;
	} = $props();

	// The ids of the clip paths of this chart.
	const uid = $props.id();
	const prefix = `c${uid.replace(/[^a-zA-Z0-9_-]/g, '')}`;

	// The gutter at the left holds the names of the ticks, the top holds the value of the tallest
	// bar, and the bottom holds the names of the bars.
	const LEFT = 56;
	const TOP = 20;
	const BOTTOM = 22;

	const ticks = $derived(threeTicks(Math.max(...categories.map((c) => c.value))));
	const plotHeight = $derived(height - TOP - BOTTOM);
	const band = $derived((width - LEFT) / categories.length);
	const barWidth = $derived(Math.round(band * 0.56));
	const y = (v: number) => Math.round(TOP + plotHeight - (v / ticks[2]) * plotHeight);
	const x = (i: number) => Math.round(LEFT + i * band + (band - barWidth) / 2);
	const bars = $derived(
		categories.map((c, i) => {
			const box = { x: x(i), y: y(c.value), width: barWidth, height: y(0) - y(c.value) };
			return { ...c, box, pattern: PATTERNS[i], marks: patternMarks(PATTERNS[i], box) };
		})
	);
</script>

<figure class="doc-chart">
	<figcaption class="doc-note">{title}</figcaption>
	<svg {width} {height} role="img" aria-label={summary}>
		<defs>
			{#each bars as bar, i (bar.label)}
				<clipPath id="{prefix}-bar-{i + 1}">
					<rect x={bar.box.x} y={bar.box.y} width={bar.box.width} height={bar.box.height} />
				</clipPath>
			{/each}
		</defs>
		{#each ticks as tick, i (i)}
			{#if tick > 0}
				<line class="doc-chart-grid" x1={LEFT} x2={width} y1={y(tick) + 0.5} y2={y(tick) + 0.5} />
			{/if}
			<text class="doc-chart-label" x={LEFT - 8} y={y(tick)} text-anchor="end" dominant-baseline="middle">{format(tick)}</text>
		{/each}
		<line class="doc-chart-base" x1={LEFT} x2={width} y1={y(0) + 0.5} y2={y(0) + 0.5} />
		{#each bars as bar, i (bar.label)}
			<g clip-path="url(#{prefix}-bar-{i + 1})" data-pattern={i + 1}>
				<g transform={bar.pattern.angle ? `rotate(${bar.pattern.angle})` : undefined}>
					{#each bar.marks as m, k (k)}
						{#if m.kind === 'line'}
							<line x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke="currentColor" stroke-width={m.width} />
						{:else if m.kind === 'circle'}
							<circle cx={m.cx} cy={m.cy} r={m.r} fill="currentColor" />
						{:else}
							<rect x={m.x} y={m.y} width={m.size} height={m.size} fill="currentColor" />
						{/if}
					{/each}
				</g>
			</g>
			<rect class="doc-chart-bar" x={bar.box.x} y={bar.box.y} width={bar.box.width} height={bar.box.height} fill="none" />
			<text class="doc-chart-value" x={bar.box.x + barWidth / 2} y={bar.box.y - 6} text-anchor="middle">{format(bar.value)}</text>
			<text class="doc-chart-label" x={bar.box.x + barWidth / 2} y={y(0) + 15} text-anchor="middle">{bar.label}</text>
		{/each}
	</svg>
</figure>

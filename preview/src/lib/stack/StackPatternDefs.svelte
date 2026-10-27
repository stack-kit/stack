<!--
	The <pattern> elements of the chart patterns, in a 0 by 0 svg. Each chart renders its own copy
	under its own prefix, which the chart makes with patternPrefix($props.id()), so that two charts
	never share an id. The svg is never display: none, because a pattern inside such an svg paints
	nothing. A tile holds the marks and no ground of its own, so the ground under the chart shows
	between the marks: the paper of a light mode, or the dark ground of a dark mode. The marks are
	chart-ink in the pattern style, and chart-n in the color pattern style. The color pattern style
	draws each line 2 px wide with crispEdges, and each dot or square at least 3 px wide, so that each
	mark shows at the value of its pair at 1x, 1.25x, 1.5x and 2x. The pattern style never takes
	crispEdges: on a 1 px line at 1.25x it can lower the line below 3:1.
	Each pattern names its number in data-pattern, so that the print listener of
	../print/pattern-fills.ts draws the marks as shapes.
-->
<script lang="ts">
	import { PATTERNS, lineCenter, markColor, styledPattern, type ChartStyle } from './patterns.js';

	let { prefix, style = 'pattern' }: { prefix: string; style?: ChartStyle } = $props();

	const lineRendering = $derived(style === 'color-pattern' ? 'crispEdges' : undefined);
</script>

<svg width="0" height="0" class="absolute" aria-hidden="true" data-pattern-defs={prefix}>
	<defs>
		{#each PATTERNS as base, i (i)}
			{@const n = i + 1}
			{@const p = styledPattern(style, base)}
			{@const h = p.stagger ? p.pitch * 2 : p.pitch}
			{@const c = lineCenter(p.pitch, p.width)}
			{@const ink = markColor(style, n)}
			<pattern
				id="{prefix}-pattern-{n}"
				data-pattern={n}
				width={p.pitch}
				height={h}
				patternUnits="userSpaceOnUse"
				patternTransform={p.angle ? `rotate(${p.angle})` : undefined}
			>
				{#if p.type === 'lines' || p.type === 'cross'}
					<line x1={c} y1="0" x2={c} y2={h} stroke={ink} stroke-width={p.width} shape-rendering={lineRendering} />
					{#if p.type === 'cross'}
						<line x1="0" y1={c} x2={p.pitch} y2={c} stroke={ink} stroke-width={p.width} shape-rendering={lineRendering} />
					{/if}
				{:else}
					{@const shifted = c + p.pitch / 2}
					{@const marks = p.stagger
						? [
								[c, c],
								[shifted, c + p.pitch],
								[shifted - p.pitch, c + p.pitch]
							]
						: [[c, c]]}
					{#each marks as [x, y], j (j)}
						{#if p.type === 'dots'}
							<circle cx={x} cy={y} r={p.width / 2} fill={ink} />
						{:else}
							<rect
								x={x - p.width / 2}
								y={y - p.width / 2}
								width={p.width}
								height={p.width}
								fill={ink}
							/>
						{/if}
					{/each}
				{/if}
			</pattern>
		{/each}
	</defs>
</svg>

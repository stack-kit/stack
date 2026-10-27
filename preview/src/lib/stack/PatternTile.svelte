<!--
	The tile of category n at the legend tile size: the marker of a legend item and of a tooltip row.
	It is a square with the fill of the shapes of the category and no edge, like those shapes: the
	pattern of the category, under the prefix of its chart, in the pattern style and in the color
	pattern style, and chart-n in the color style.
-->
<script lang="ts">
	import { LEGEND_TILE, categoryFill, type ChartStyle } from './patterns.js';

	let { prefix, n, style = 'pattern' }: { prefix: string; n: number; style?: ChartStyle } = $props();
</script>

<svg width={LEGEND_TILE} height={LEGEND_TILE} aria-hidden="true" class="shrink-0" data-pattern-tile={n}>
	<rect width={LEGEND_TILE} height={LEGEND_TILE} fill={categoryFill(style, prefix, n)} />
</svg>

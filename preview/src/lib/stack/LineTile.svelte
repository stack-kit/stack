<!--
	The tile of a line at the legend tile size: the marker of a tooltip row of a line chart. It holds a
	short piece of the line across its middle, with the stroke of the line: a solid line, two dots of
	a dotted line, or a dash, a gap and a dash of the comparison line.
-->
<script lang="ts">
	import { LEGEND_TILE, strokeAttributes, type LineLook } from './patterns.js';

	let { look }: { look: LineLook } = $props();

	const mid = LEGEND_TILE / 2;
	// A dotted line puts its dots at 3 and 9 px, a dashed line starts in the middle of a dash, and a
	// solid line keeps its round ends inside the tile.
	const ends = $derived(
		look.dash === '0 6' ? { x1: 3, x2: 9, offset: 0 } : look.dash ? { x1: 0, x2: LEGEND_TILE, offset: 3 } : { x1: 1, x2: LEGEND_TILE - 1, offset: 0 }
	);
</script>

<svg width={LEGEND_TILE} height={LEGEND_TILE} aria-hidden="true" class="shrink-0" data-line-tile>
	<line x1={ends.x1} x2={ends.x2} y1={mid} y2={mid} {...strokeAttributes(look)} stroke-dashoffset={ends.offset || undefined} />
</svg>

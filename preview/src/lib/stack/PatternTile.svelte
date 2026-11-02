<!--
	The tile of category n at the legend tile size: the marker of a legend item and of a tooltip row.
	It is a square with the fill of the shapes of the category and no edge, like those shapes: the
	pattern of the category, under the prefix of its chart, in the pattern style and in the color
	pattern style, and chart-n in the color style.
-->
<script lang="ts" module>
	import type { SVGAttributes } from 'svelte/elements';
	import type { ChartStyle } from './patterns.js';

	export type PatternTileProps = Omit<SVGAttributes<SVGSVGElement>, 'children' | 'style'> & {
		ref?: SVGSVGElement | null;
		/** The prefix of the patterns of the chart, from patternPrefix($props.id()). */
		prefix: string;
		/** The number of the category, from 1. */
		n: number;
		style?: ChartStyle;
	};
</script>

<script lang="ts">
	import { cn } from '#lib/utils.js';
	import { LEGEND_TILE, categoryFill } from './patterns.js';

	let { prefix, n, style = 'pattern', class: className, ref = $bindable(null), ...rest }: PatternTileProps = $props();
</script>

<svg
	bind:this={ref}
	width={LEGEND_TILE}
	height={LEGEND_TILE}
	aria-hidden="true"
	data-slot="pattern-tile"
	data-pattern-tile={n}
	class={cn('shrink-0', className)}
	{...rest}
>
	<rect width={LEGEND_TILE} height={LEGEND_TILE} fill={categoryFill(style, prefix, n)} />
</svg>

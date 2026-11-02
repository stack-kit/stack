<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Side =
		| {
				/** The side column: the facts, the links and the records that support the main column. */
				side: Snippet;
				/** The name of the side column in the language of the product, such as "Facts of the run". */
				sideLabel: string;
		  }
		| { side?: never; sideLabel?: never };

	export type PageColumnsProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> &
		Side & {
			ref?: HTMLDivElement | null;
			/** The main column of the page. */
			children: Snippet;
		};
</script>

<script lang="ts">
	import { cn } from '#lib/utils.js';

	// The columns of a page ("Page width" in ### Width bands, and ### Side column of DESIGN.md). The
	// main column has the side padding of a page, 16 px below 768 px and 24 px from 768 px, and 24 px at
	// the top and the bottom. It takes min-w-0, so a wide part in it scrolls inside its own box and the
	// page is never wider than the screen. The side column is an aside with a name, after the main
	// column in the code. From 1280 px it stands at the right, 320 px wide with a border edge on its
	// left and 16 px of side padding, and each column scrolls on its own. Below 1280 px it moves under
	// the main column at the full width with a border edge on top, and the page scrolls as one in the
	// root. The root and each column are the containing block of the absolute boxes in them (relative),
	// so such a box, such as a line for a screen reader under a long main column, scrolls with the box
	// that scrolls. A static root and static columns let that box out to the frame, which made the
	// document higher than the window, and a wheel over a short side column then scrolled the document.
	// A wheel at the end of the box that scrolls stops there: the root from 768 px and each column from
	// 1280 px (overscroll-contain). Below 768 px the root keeps the overscroll of the browser.
	let { children, side, sideLabel, class: className, ref = $bindable(null), ...rest }: PageColumnsProps = $props();
</script>

<div bind:this={ref} data-slot="page-columns" class={cn('relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto md:overscroll-contain xl:flex-row xl:overflow-hidden', className)} {...rest}>
	<div data-slot="page-columns-main" class="relative flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6 xl:overflow-y-auto xl:overscroll-contain">{@render children()}</div>
	{#if side}
		<aside data-slot="page-columns-side" aria-label={sideLabel} class="relative flex shrink-0 flex-col gap-6 border-t border-border px-4 py-6 md:px-6 xl:w-80 xl:overflow-y-auto xl:overscroll-contain xl:border-t-0 xl:border-l xl:px-4">
			{@render side()}
		</aside>
	{/if}
</div>

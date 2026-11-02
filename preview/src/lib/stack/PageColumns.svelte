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
	// the main column at the full width with a border edge on top, and the page scrolls as one.
	let { children, side, sideLabel, class: className, ref = $bindable(null), ...rest }: PageColumnsProps = $props();
</script>

<div bind:this={ref} data-slot="page-columns" class={cn('flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto xl:flex-row xl:overflow-hidden', className)} {...rest}>
	<div data-slot="page-columns-main" class="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6 xl:overflow-y-auto">{@render children()}</div>
	{#if side}
		<aside data-slot="page-columns-side" aria-label={sideLabel} class="flex shrink-0 flex-col gap-6 border-t border-border px-4 py-6 md:px-6 xl:w-80 xl:overflow-y-auto xl:border-t-0 xl:border-l xl:px-4">
			{@render side()}
		</aside>
	{/if}
</div>

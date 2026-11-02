<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export type SummaryBandsProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		ref?: HTMLDivElement | null;
		/** The bands, each one element, such as a section with a heading: the figure band first, then the lists and the meters. */
		children: Snippet;
	};
</script>

<script lang="ts">
	import { cn } from '#lib/utils.js';

	// The bands of a summary page (### Summary page of DESIGN.md). The key figures stand in the first
	// band, under the title of the page and before every other part. The lists and the meters follow in
	// bands with a border divider between two bands, 32 px from each band. No band takes a card. Each
	// child of the part is one band.
	let { children, class: className, ref = $bindable(null), ...rest }: SummaryBandsProps = $props();
</script>

<div bind:this={ref} data-slot="summary-bands" class={cn('flex min-w-0 flex-col gap-8 [&>*+*]:border-t [&>*+*]:border-border [&>*+*]:pt-8', className)} {...rest}>
	{@render children()}
</div>

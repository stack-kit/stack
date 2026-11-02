<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export type ReadingColumnProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		ref?: HTMLDivElement | null;
		/** The running text and its parts, such as the body of a ticket or a document. */
		children: Snippet;
	};
</script>

<script lang="ts">
	import { cn } from '#lib/utils.js';

	// A column of running text (### Reading column of DESIGN.md): at most 720 px wide, at the start
	// edge of its region and never centered, so each line keeps its place when the region changes its
	// width. The side padding stays with the region, outside the 720 px. Its parts stand 24 px apart, as
	// the sections of a page, and a long word breaks, so the column is never wider than the screen.
	let { children, class: className, ref = $bindable(null), ...rest }: ReadingColumnProps = $props();
</script>

<div bind:this={ref} data-slot="reading-column" class={cn('flex w-full min-w-0 max-w-180 flex-col gap-6 wrap-break-word', className)} {...rest}>
	{@render children()}
</div>

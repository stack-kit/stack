<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	export type GapProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
		ref?: HTMLSpanElement | null;
		/** What the gap means, such as "Does not apply" or "No lead in the period". A screen reader reads it in place of the dash. */
		reason: string;
	};
</script>

<script lang="ts">
	import { cn } from '#lib/utils.js';

	// A table cell where the row has no such value ("Variants" in ### table of DESIGN.md): an em dash
	// in muted-foreground that a screen reader skips, then a hidden text that names the gap. A cell never
	// stays empty, because an empty cell looks like a value that did not load, and an en dash looks
	// like the minus sign of a negative amount.
	let { reason, class: className, ref = $bindable(null), ...rest }: GapProps = $props();
</script>

<span bind:this={ref} data-slot="gap" class={cn(className)} {...rest}><span aria-hidden="true" class="text-muted-foreground">&mdash;</span><span class="sr-only">{reason}</span></span>

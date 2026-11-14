<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	/** One property of the item: its label and its value. */
	export type StripProperty = {
		/** The name of the property, such as "Owner". Each label names one property, so no two properties have the same label. */
		label: string;
		/** A value that the system sets, as text, or a snippet of the page, such as a ghost button of size xs that opens a picker. */
		value: string | Snippet;
	};

	export type PropertyStripProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
		ref?: HTMLElement | null;
		/** The name of the properties for a screen reader, such as "Properties". */
		label: string;
		/** The properties, in the order of the properties panel. */
		properties: readonly StripProperty[];
	};
</script>

<script lang="ts">
	import { cn } from '#lib/utils.js';

	// The properties of an item as one row of values under its title ("Row of values" in ### Detail
	// pane of DESIGN.md, and ### property-strip). It takes the place of the properties panel in the
	// item column and the pane of band 2, and in an item that shows no properties panel. The section
	// takes the name of label and holds a description list, so a screen reader reads each label and its
	// value as a term and its description. The row wraps. Two properties stand 16 px apart (gap-x-4),
	// and a label stands 8 px before its value (gap-2). The label has a line of 30 px (leading-7.5,
	// spacing.property-row), and the label and the value share a baseline, so a text value and the text
	// of a button of 24 px stand on one line. A property is at most as wide as the row, and its value
	// breaks a long word, so a long value takes a line of its own and wraps, and no value is cut.
	let { label, properties, class: className, ref = $bindable(null), ...rest }: PropertyStripProps = $props();
</script>

<section bind:this={ref} data-slot="property-strip" aria-label={label} class={cn('min-w-0', className)} {...rest}>
	<dl class="flex flex-wrap gap-x-4">
		{#each properties as p (p.label)}
			<div data-slot="property-strip-item" class="flex max-w-full min-w-0 items-baseline gap-2 text-xs">
				<dt data-slot="property-strip-label" class="shrink-0 leading-7.5 text-muted-foreground">{p.label}</dt>
				<dd data-slot="property-strip-value" class="min-w-0 wrap-break-word">{#if typeof p.value === 'string'}{p.value}{:else}{@render p.value()}{/if}</dd>
			</div>
		{/each}
	</dl>
</section>

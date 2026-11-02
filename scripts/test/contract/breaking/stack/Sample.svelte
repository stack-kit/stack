<!-- The breaking case: label is renamed to heading, sample-head loses its data-slot, size is narrowed, count is
     a new required prop, and the default of tone changes. -->
<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	/** @behaviour escape:close */
	export type SampleTone = 'plain' | 'strong';
	export type SampleProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		ref?: HTMLDivElement | null;
		heading: string;
		size?: 'sm' | 'md';
		tone?: SampleTone;
		count: number;
		ondismiss?: () => void;
		children: Snippet;
	};
</script>

<script lang="ts">
	import { cn } from '#lib/utils.js';

	let { ref = $bindable(null), heading, size = 'md', tone = 'strong', count, ondismiss, children, class: className, ...rest }: SampleProps = $props();
</script>

<div bind:this={ref} data-slot="sample" class={cn('flex flex-col gap-2 p-4', className)} {...rest}>
	<p class="text-sm font-medium">{heading} ({count})</p>
	<div data-slot="sample-body" data-size={size} data-tone={tone}>{@render children()}</div>
	<button type="button" onclick={() => ondismiss?.()}>Close</button>
</div>

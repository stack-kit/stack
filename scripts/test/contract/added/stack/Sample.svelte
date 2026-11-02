<!-- The added case, with Extra.svelte: a new optional prop hint and a new optional snippet footer. -->
<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	/** @behaviour escape:close */
	export type SampleTone = 'plain' | 'strong';
	export type SampleProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		ref?: HTMLDivElement | null;
		label: string;
		hint?: string;
		size?: 'sm' | 'md' | 'lg';
		tone?: SampleTone;
		ondismiss?: () => void;
		children: Snippet;
		footer?: Snippet;
	};
</script>

<script lang="ts">
	import { cn } from '#lib/utils.js';

	let { ref = $bindable(null), label, hint, size = 'md', tone = 'plain', ondismiss, children, footer, class: className, ...rest }: SampleProps = $props();
</script>

<div bind:this={ref} data-slot="sample" class={cn('flex flex-col gap-2 p-4', className)} {...rest}>
	<p data-slot="sample-head" class="text-sm font-medium" title={hint}>{label}</p>
	<div data-slot="sample-body" data-size={size} data-tone={tone}>{@render children()}</div>
	{@render footer?.()}
	<button type="button" onclick={() => ondismiss?.()}>Close</button>
</div>

<!-- The look-only case: other classes, another order of the attributes, more markup with no data-slot. -->
<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	/** @behaviour escape:close */
	export type SampleTone = 'plain' | 'strong';
	export type SampleProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		ref?: HTMLDivElement | null;
		label: string;
		size?: 'sm' | 'md' | 'lg';
		tone?: SampleTone;
		ondismiss?: () => void;
		children: Snippet;
	};
</script>

<script lang="ts">
	import { cn } from '#lib/utils.js';

	let { ref = $bindable(null), label, size = 'md', tone = 'plain', ondismiss, children, class: className, ...rest }: SampleProps = $props();
</script>

<div data-slot="sample" bind:this={ref} class={cn('grid gap-3 rounded-lg border p-6 max-md:p-4', className)} {...rest}>
	<p class="text-base font-semibold" data-slot="sample-head">{label}</p>
	<div data-slot="sample-body" data-size={size} data-tone={tone}><span class="sr-only">Body</span>{@render children()}</div>
	<button class="h-8 px-3" type="button" onclick={() => ondismiss?.()}>Close</button>
</div>

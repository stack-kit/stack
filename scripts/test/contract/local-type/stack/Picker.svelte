<!-- The local-type case: Choice loses note, gains the required rank and the optional hint, and weight widens. -->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	type Choice = { id: string; label: string; rank: number; hint?: boolean; weight: number | string };
	const UNIT = 'choices';
	const words = (n: number) => `${n} ${UNIT}`;
</script>

<script lang="ts" generics="T extends { id: string }">
	import { cn } from '#lib/utils.js';

	let {
		ref = $bindable(null),
		items,
		choices,
		value = $bindable(0),
		count = words,
		class: className,
		...rest
	}: HTMLAttributes<HTMLDivElement> & {
		ref?: HTMLDivElement | null;
		items: T[];
		choices: Choice[];
		value?: number;
		count?: (n: number) => string;
	} = $props();
</script>

<div bind:this={ref} data-slot="picker" class={cn('flex gap-2', className)} {...rest}>
	{count(items.length)}, {choices.length}, {value}
</div>

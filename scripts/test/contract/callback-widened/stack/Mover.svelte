<!-- The callback-widened case: onmove takes an optional parameter at its end and may return a Promise,
     and onread may return a string too. A function that a product gave before still fits each one. -->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	export type MoverProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		ref?: HTMLDivElement | null;
		onmove?: (id: string, to: number, undo?: boolean) => void | Promise<void>;
		onpick?: (id: string | number) => void;
		onread?: (id: string) => boolean | string;
	};
</script>

<script lang="ts">
	import { cn } from '#lib/utils.js';

	let { ref = $bindable(null), onmove, onpick, onread, class: className, ...rest }: MoverProps = $props();
</script>

<div bind:this={ref} data-slot="mover" class={cn('flex gap-2', className)} {...rest}>
	<button type="button" onclick={() => onmove?.('a', 1)}>Move</button>
	<button type="button" onclick={() => onpick?.('a')}>Pick</button>
	<button type="button" onclick={() => onread?.('a')}>Read</button>
</div>

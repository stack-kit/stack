<!-- The callback-narrowed case: onmove takes a required parameter at its end, onpick takes a narrower
     parameter, and onread returns a narrower type. Each one stays a breaking change. -->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	export type MoverProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		ref?: HTMLDivElement | null;
		onmove?: (id: string, to: number, undo: boolean) => void;
		onpick?: (id: string) => void;
		onread?: (id: string) => true;
	};
</script>

<script lang="ts">
	import { cn } from '#lib/utils.js';

	let { ref = $bindable(null), onmove, onpick, onread, class: className, ...rest }: MoverProps = $props();
</script>

<div bind:this={ref} data-slot="mover" class={cn('flex gap-2', className)} {...rest}>
	<button type="button" onclick={() => onmove?.('a', 1, false)}>Move</button>
	<button type="button" onclick={() => onpick?.('a')}>Pick</button>
	<button type="button" onclick={() => onread?.('a')}>Read</button>
</div>

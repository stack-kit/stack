<!-- The callback part of the contract test. The cases callback-widened and callback-narrowed copy their
     own Mover.svelte over this one. -->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	export type MoverProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		ref?: HTMLDivElement | null;
		onmove?: (id: string, to: number) => void;
		onpick?: (id: string | number) => void;
		onread?: (id: string) => boolean;
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
